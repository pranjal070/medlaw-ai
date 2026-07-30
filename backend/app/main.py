import os
import json
import shutil
from typing import List, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from . import models, schemas, auth, parser, gemini

# Create Database tables on start
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedLaw AI Backend", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper: Extract Gemini Key from header or .env
def get_gemini_api_key(x_gemini_key: Optional[str] = Header(None)) -> Optional[str]:
    return x_gemini_key or os.getenv("GEMINI_API_KEY")


# ---------------------------------------------------------
# Authentication Routes
# ---------------------------------------------------------

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not db_user or not auth.verify_password(user_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ---------------------------------------------------------
# Document Upload and Analysis Routes
# ---------------------------------------------------------

@app.post("/api/documents/upload", response_model=schemas.DocumentDetailResponse)
async def upload_document(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "medical" or "legal"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    api_key: Optional[str] = Depends(get_gemini_api_key)
):
    if file_type not in ["medical", "legal"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Must be 'medical' or 'legal'")
    
    # Save file locally
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}{file_ext}"
    local_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(local_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read file bytes for potential image/multimodal analysis
    with open(local_path, "rb") as f:
        file_bytes = f.read()
    
    # Determine MIME type
    mime_type = file.content_type
    if not mime_type:
        if file_ext.lower() == ".png":
            mime_type = "image/png"
        elif file_ext.lower() in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        elif file_ext.lower() == ".pdf":
            mime_type = "application/pdf"
            
    # Step 1: Extract Text Content locally if it's PDF/DOCX/TXT
    text_content = ""
    try:
        text_content = parser.extract_document_text(local_path, file.filename)
    except Exception as e:
        print(f"Local parser failed: {str(e)}")
        
    # Step 2: Perform AI Analysis using Gemini
    analysis_result = {}
    if file_type == "medical":
        # If text extraction yielded nothing (e.g. scanned image/PDF), we send file bytes to Gemini.
        is_scanned = len(text_content.strip()) < 50
        bytes_to_send = file_bytes if (is_scanned and mime_type in ["image/png", "image/jpeg", "application/pdf"]) else None
        m_type_to_send = mime_type if bytes_to_send else None
        
        analysis_result = gemini.analyze_medical_document(
            text_content=text_content,
            file_bytes=bytes_to_send,
            mime_type=m_type_to_send,
            api_key=api_key
        )
    else:
        is_scanned = len(text_content.strip()) < 50
        bytes_to_send = file_bytes if (is_scanned and mime_type in ["image/png", "image/jpeg", "application/pdf"]) else None
        m_type_to_send = mime_type if bytes_to_send else None
        
        analysis_result = gemini.analyze_legal_document(
            text_content=text_content,
            file_bytes=bytes_to_send,
            mime_type=m_type_to_send,
            api_key=api_key
        )

    # If the text content was empty (scanned image) but Gemini returned results, 
    # we can synthesize a readable text content from the summary
    if not text_content:
        if file_type == "medical":
            text_content = f"Medical Report Summary:\n{analysis_result.get('summary', {}).get('overall_health', '')}"
        else:
            text_content = f"Legal Document Summary:\n{analysis_result.get('summary', {}).get('purpose', '')}"

    # Step 3: Save Document in database
    db_doc = models.Document(
        user_id=current_user.id,
        filename=file.filename,
        file_type=file_type,
        text_content=text_content,
        summary_json=json.dumps(analysis_result.get("summary", {}))
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Step 4: Save Structured Entities (Tests or Clauses)
    if file_type == "medical":
        for t in analysis_result.get("tests", []):
            db_test = models.MedicalTest(
                document_id=db_doc.id,
                test_name=t.get("test_name"),
                result_val=str(t.get("result_val", "")),
                unit=t.get("unit"),
                normal_range=t.get("normal_range"),
                status=t.get("status", "Normal"),
                explanation=t.get("explanation")
            )
            db.add(db_test)
    else:
        for c in analysis_result.get("clauses", []):
            db_clause = models.LegalClause(
                document_id=db_doc.id,
                clause_title=c.get("clause_title"),
                original_text=c.get("original_text", ""),
                explanation=c.get("explanation", ""),
                risk_level=c.get("risk_level", "Low"),
                risk_explanation=c.get("risk_explanation")
            )
            db.add(db_clause)
            
    db.commit()
    
    # Step 5: Index Document Chunks and Embeddings for RAG
    chunks = gemini.chunk_text(text_content)
    for idx, chunk in enumerate(chunks):
        emb = gemini.get_embedding(chunk, api_key=api_key)
        db_chunk = models.DocumentChunk(
            document_id=db_doc.id,
            chunk_index=idx,
            text=chunk,
            embedding_json=json.dumps(emb)
        )
        db.add(db_chunk)
        
    db.commit()
    db.refresh(db_doc)
    return db_doc

@app.get("/api/documents", response_model=List[schemas.DocumentResponse])
def list_documents(
    file_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Document).filter(models.Document.user_id == current_user.id)
    if file_type:
        query = query.filter(models.Document.file_type == file_type)
    if search:
        query = query.filter(models.Document.filename.like(f"%{search}%"))
        
    return query.order_by(models.Document.uploaded_at.desc()).all()

@app.get("/api/documents/{document_id}", response_model=schemas.DocumentDetailResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id, 
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@app.delete("/api/documents/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}


# ---------------------------------------------------------
# Report Comparison Route
# ---------------------------------------------------------

def parse_float_safe(val: str) -> Optional[float]:
    try:
        # Strip units if present or clean non-numeric characters
        cleaned = "".join([c for c in val if c.isdigit() or c in [".", "-"]])
        return float(cleaned)
    except Exception:
        return None

@app.get("/api/documents/compare/{doc1_id}/{doc2_id}", response_model=schemas.ComparisonResponse)
def compare_medical_reports(
    doc1_id: int,
    doc2_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    doc1 = db.query(models.Document).filter(models.Document.id == doc1_id, models.Document.user_id == current_user.id).first()
    doc2 = db.query(models.Document).filter(models.Document.id == doc2_id, models.Document.user_id == current_user.id).first()
    
    if not doc1 or not doc2:
        raise HTTPException(status_code=404, detail="One or both documents not found")
        
    if doc1.file_type != "medical" or doc2.file_type != "medical":
        raise HTTPException(status_code=400, detail="Only medical reports can be compared")
        
    # Order by date: doc1 older, doc2 newer
    if doc1.uploaded_at > doc2.uploaded_at:
        doc1, doc2 = doc2, doc1
        
    # Map tests by name for comparison
    tests1 = {t.test_name.lower().strip(): t for t in doc1.medical_tests}
    tests2 = {t.test_name.lower().strip(): t for t in doc2.medical_tests}
    
    improvements = []
    worsenings = []
    stables = []
    
    all_names = set(tests1.keys()).union(set(tests2.keys()))
    
    for name in all_names:
        t1 = tests1.get(name)
        t2 = tests2.get(name)
        
        # We need the test to exist in both reports to perform a comparison
        if not t1 or not t2:
            continue
            
        val1_num = parse_float_safe(t1.result_val)
        val2_num = parse_float_safe(t2.result_val)
        unit = t2.unit or t1.unit
        
        status1 = t1.status
        status2 = t2.status
        
        change_type = "stable"
        explanation = ""
        
        # Comparison logic based on status and numeric values
        if status1 == "Normal" and status2 == "Normal":
            change_type = "stable"
            explanation = f"Value remains stable within normal boundaries (from {t1.result_val} to {t2.result_val} {unit})."
        elif status1 in ["Low", "High"] and status2 == "Normal":
            change_type = "improved"
            explanation = f"Extremely positive trend. Test value returned to normal range (was {t1.result_val} {status1}, now {t2.result_val})."
        elif status1 == "Normal" and status2 in ["Low", "High"]:
            change_type = "worsened"
            explanation = f"Needs attention. Test value fell out of the normal range (was {t1.result_val}, now {t2.result_val} {status2})."
        elif status1 in ["Low", "High"] and status2 in ["Low", "High"]:
            if val1_num is not None and val2_num is not None:
                # If both are Low, check if val2 > val1 (improving)
                if status1 == "Low" and status2 == "Low":
                    if val2_num > val1_num:
                        change_type = "improved"
                        explanation = f"Improving trend. Deficient value increased closer to normal range (from {t1.result_val} to {t2.result_val} {unit})."
                    elif val2_num < val1_num:
                        change_type = "worsened"
                        explanation = f"Declining trend. Deficient value decreased further (from {t1.result_val} to {t2.result_val} {unit})."
                    else:
                        change_type = "stable"
                        explanation = f"Remains stable but deficient at {t2.result_val} {unit}."
                # If both are High, check if val2 < val1 (improving)
                elif status1 == "High" and status2 == "High":
                    if val2_num < val1_num:
                        change_type = "improved"
                        explanation = f"Improving trend. Elevated value decreased closer to normal range (from {t1.result_val} to {t2.result_val} {unit})."
                    elif val2_num > val1_num:
                        change_type = "worsened"
                        explanation = f"Declining trend. Elevated value increased further (from {t1.result_val} to {t2.result_val} {unit})."
                    else:
                        change_type = "stable"
                        explanation = f"Remains stable but elevated at {t2.result_val} {unit}."
            else:
                if status1 == status2:
                    change_type = "stable"
                    explanation = f"Status remains unchanged ({status2}) at {t2.result_val} {unit}."
                else:
                    change_type = "unknown"
                    explanation = f"Status shifted from {status1} ({t1.result_val}) to {status2} ({t2.result_val})."
                    
        item = schemas.TestComparisonItem(
            test_name=t2.test_name,
            report1_val=t1.result_val,
            report2_val=t2.result_val,
            unit=unit,
            status1=status1,
            status2=status2,
            change_type=change_type,
            explanation=explanation
        )
        
        if change_type == "improved":
            improvements.append(item)
        elif change_type == "worsened":
            worsenings.append(item)
        else:
            stables.append(item)
            
    return schemas.ComparisonResponse(
        report1_filename=doc1.filename,
        report2_filename=doc2.filename,
        report1_date=doc1.uploaded_at,
        report2_date=doc2.uploaded_at,
        improvements=improvements,
        worsenings=worsenings,
        stables=stables
    )


# ---------------------------------------------------------
# RAG Chat Routes
# ---------------------------------------------------------

@app.post("/api/chat/session", response_model=schemas.ChatSessionResponse)
def create_chat_session(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id, 
        models.Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    session = models.ChatSession(
        user_id=current_user.id,
        document_id=document_id,
        title=f"Chat on {doc.filename} ({datetime.utcnow().strftime('%Y-%m-%d %H:%M')})"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.get("/api/chat/sessions/{document_id}", response_model=List[schemas.ChatSessionListResponse])
def list_chat_sessions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.ChatSession).filter(
        models.ChatSession.document_id == document_id,
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()

@app.get("/api/chat/session/{session_id}", response_model=schemas.ChatSessionResponse)
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@app.post("/api/chat/session/{session_id}/message", response_model=schemas.ChatMessageResponse)
def send_chat_message(
    session_id: int,
    message_data: schemas.ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    api_key: Optional[str] = Depends(get_gemini_api_key)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    # Save user message
    user_msg = models.ChatMessage(
        session_id=session_id,
        sender="user",
        message_text=message_data.message_text
    )
    db.add(user_msg)
    db.commit()
    
    # Retrieve Document Chunks for RAG
    chunks_query = db.query(models.DocumentChunk).filter(
        models.DocumentChunk.document_id == session.document_id
    ).all()
    
    chunks_db = [
        {"text": c.text, "embedding_json": c.embedding_json} 
        for c in chunks_query
    ]
    
    # Perform similarity matching
    retrieved = gemini.retrieve_chunks(
        query=message_data.message_text,
        chunks_db=chunks_db,
        api_key=api_key,
        top_k=3
    )
    
    # Fetch recent message history (last 10 messages)
    history_query = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.created_at.asc()).all()[-10:]
    
    history = [
        {"sender": msg.sender, "message_text": msg.message_text} 
        for msg in history_query
    ]
    
    # Generate response
    doc_type = session.document.file_type
    ai_answer = gemini.generate_chat_response(
        query=message_data.message_text,
        context_chunks=retrieved,
        doc_type=doc_type,
        history=history,
        api_key=api_key
    )
    
    # Save AI message
    ai_msg = models.ChatMessage(
        session_id=session_id,
        sender="ai",
        message_text=ai_answer
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    return ai_msg
