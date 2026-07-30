import os
import json
import random
import numpy as np
from typing import List, Dict, Any, Optional
import google.generativeai as genai

# Helper to configure Gemini API client
def get_gemini_model(api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
    # Priority: 1. Passed API key (from request headers), 2. Environment variable
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    try:
        genai.configure(api_key=key)
        return genai.GenerativeModel(model_name)
    except Exception:
        return None

# Generate vector embedding for RAG chunks
def get_embedding(text: str, api_key: Optional[str] = None) -> List[float]:
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        # Return a mock 768-dim vector
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(768)]
    
    try:
        genai.configure(api_key=key)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )
        return result["embedding"]
    except Exception as e:
        print(f"Embedding error: {str(e)}. Falling back to mock embedding.")
        random.seed(hash(text))
        return [random.uniform(-0.1, 0.1) for _ in range(768)]

# Chunk text for RAG indexing
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

# Retrieve top-k chunks using cosine similarity
def retrieve_chunks(query: str, chunks_db: List[Dict[str, Any]], api_key: Optional[str] = None, top_k: int = 3) -> List[str]:
    if not chunks_db:
        return []
    
    # Generate query embedding
    query_emb = get_embedding(query, api_key=api_key)
    query_vector = np.array(query_emb)
    
    scores = []
    for c in chunks_db:
        c_vector = np.array(json.loads(c["embedding_json"]))
        # Cosine similarity
        dot_product = np.dot(query_vector, c_vector)
        norm_q = np.linalg.norm(query_vector)
        norm_c = np.linalg.norm(c_vector)
        
        if norm_q > 0 and norm_c > 0:
            similarity = dot_product / (norm_q * norm_c)
        else:
            similarity = 0.0
        scores.append((similarity, c["text"]))
    
    # Sort by similarity desc
    scores.sort(key=lambda x: x[0], reverse=True)
    return [text for score, text in scores[:top_k]]


# ---------------------------------------------------------
# Medical Analyzer Section
# ---------------------------------------------------------

MEDICAL_SYSTEM_PROMPT = """
You are an expert Medical Report Analyzer. Your task is to extract information from the medical report provided and output a structured JSON report.
You must return a JSON object with the following schema:
{
  "summary": {
    "overall_health": "Short paragraph summarizing the overall health status of the patient.",
    "key_findings": ["Bullet point 1", "Bullet point 2"],
    "abnormal_parameters": ["List of parameters that are out of bounds"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "attention_tests": ["Tests that require immediate doctor visit or attention"]
  },
  "tests": [
    {
      "test_name": "Name of the medical test (e.g. Hemoglobin, Vitamin D)",
      "result_val": "Numeric result value with decimal (e.g. 10.5, 32.1) or qualitative (e.g. Positive)",
      "unit": "Unit of measurement (e.g. g/dL, ng/mL) or null",
      "normal_range": "Normal range description (e.g. 12-16, >30) or null",
      "status": "Normal" or "Low" or "High" or "Attention",
      "explanation": "Simple 1-2 sentence explanation of what this test result means, possible lifestyle adjustments, and when to seek advice. Never declare a diagnosis."
    }
  ]
}

Strict Rules:
1. Do not diagnose any diseases or prescribe medicines.
2. If there are abnormal values, provide general educational explanations.
3. Always maintain a professional, helpful but cautious tone.
4. Output must be valid JSON only. Do not wrap in markdown tags like ```json.
"""

MOCK_MEDICAL_RESPONSE = {
    "summary": {
        "overall_health": "The patient shows a generally stable health profile, but exhibits significant deficiencies in essential nutrients and mild anemia indicators. Most metabolic parameters are normal.",
        "key_findings": [
            "Hemoglobin levels are slightly below the healthy reference range.",
            "Vitamin D level is severely deficient.",
            "Cholesterol is slightly elevated above the optimal threshold."
        ],
        "abnormal_parameters": ["Hemoglobin", "Vitamin D", "Total Cholesterol"],
        "recommendations": [
            "Consider Vitamin D supplementation after consulting a physician.",
            "Increase intake of iron-rich foods (e.g., spinach, red meat, lentils).",
            "Incorporate light aerobic exercise and monitor dietary fat intake."
        ],
        "attention_tests": ["Vitamin D (Severely Low)"]
    },
    "tests": [
        {
            "test_name": "Hemoglobin",
            "result_val": "10.5",
            "unit": "g/dL",
            "normal_range": "12.0 - 16.0",
            "status": "Low",
            "explanation": "Slightly low hemoglobin indicates mild anemia. It can cause mild fatigue and is often addressed by adjusting dietary iron and vitamin intake."
        },
        {
            "test_name": "Vitamin D",
            "result_val": "15.0",
            "unit": "ng/mL",
            "normal_range": "30.0 - 100.0",
            "status": "Low",
            "explanation": "Severe Vitamin D deficiency can impact bone density and immune function. Daily sun exposure or supplementation is usually advised."
        },
        {
            "test_name": "Total Cholesterol",
            "result_val": "235.0",
            "unit": "mg/dL",
            "normal_range": "< 200.0",
            "status": "High",
            "explanation": "Elevated cholesterol levels can increase cardiovascular risk over time. Minimizing saturated fats and increasing soluble fiber can help."
        },
        {
            "test_name": "Thyroid Stimulating Hormone (TSH)",
            "result_val": "2.4",
            "unit": "uIU/mL",
            "normal_range": "0.4 - 4.5",
            "status": "Normal",
            "explanation": "TSH levels are within the optimal range, suggesting that thyroid function is currently well-balanced."
        },
        {
            "test_name": "Blood Glucose (Fasting)",
            "result_val": "92.0",
            "unit": "mg/dL",
            "normal_range": "70.0 - 100.0",
            "status": "Normal",
            "explanation": "Fasting blood sugar is normal, indicating healthy insulin management and glucose regulation."
        }
    ]
}

def analyze_medical_document(text_content: str, file_bytes: Optional[bytes] = None, mime_type: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    model = get_gemini_model(api_key)
    
    if not model:
        # If API key not set, return realistic mock data
        print("Using Mock Medical Analyzer")
        return MOCK_MEDICAL_RESPONSE
    
    try:
        prompt = "Analyze this medical document:\n" + text_content if text_content else "Analyze this uploaded medical image."
        
        contents = []
        if file_bytes and mime_type:
            contents.append({
                "mime_type": mime_type,
                "data": file_bytes
            })
        contents.append(prompt)
        
        # Call Gemini in JSON mode
        response = model.generate_content(
            contents,
            generation_config={"response_mime_type": "application/json"},
            system_instruction=MEDICAL_SYSTEM_PROMPT
        )
        
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini medical analysis failed: {str(e)}. Falling back to mock data.")
        return MOCK_MEDICAL_RESPONSE


# ---------------------------------------------------------
# Legal Analyzer Section
# ---------------------------------------------------------

LEGAL_SYSTEM_PROMPT = """
You are an expert Legal Document Analyzer. Your task is to extract information from the legal agreement and provide a structured JSON report.
You must return a JSON object with the following schema:
{
  "summary": {
    "document_type": "E.g. Lease Agreement, NDA, Employment Contract",
    "purpose": "1-2 sentences explaining the main objective of this document.",
    "key_dates": ["List of important dates like start date, expiration date, notice milestones"],
    "responsibilities": ["Responsibility 1", "Responsibility 2"],
    "payment_terms": "Description of any financial obligations, salary, or security deposit details, or 'N/A'",
    "termination_conditions": "Details about how either party can end the agreement."
  },
  "clauses": [
    {
      "clause_title": "Name of the clause (e.g. Notice Period, Non-Compete, Indemnification)",
      "original_text": "Exact text quote or summary of the clause from the document.",
      "explanation": "Simple plain-English translation explaining what this means to an average person.",
      "risk_level": "Low" or "Medium" or "High",
      "risk_explanation": "Why this clause is marked with this risk level and what the user should watch out for."
    }
  ]
}

Strict Rules:
1. Do not provide legal advice.
2. Explain legalese in simple, direct language.
3. Show clearly that users must consult a qualified lawyer.
4. Output must be valid JSON only. Do not wrap in markdown tags like ```json.
"""

MOCK_LEGAL_RESPONSE = {
    "summary": {
        "document_type": "Employment Agreement",
        "purpose": "Establishes an employment contract between the Employer and the Employee, outlining roles, compensation, and workplace regulations.",
        "key_dates": [
            "Start Date: August 1, 2026",
            "Notice Period: 60 days written notification before resignation"
        ],
        "responsibilities": [
            "Perform duties associated with the Software Engineer role.",
            "Maintain strict confidentiality of proprietary company materials."
        ],
        "payment_terms": "Base salary of $90,000 USD per annum, payable in semi-monthly installments, plus eligibility for performance bonuses.",
        "termination_conditions": "Can be terminated by either party with a 60-day written notice, or immediately by the employer 'For Cause' without notice."
    },
    "clauses": [
        {
            "clause_title": "Notice Period",
            "original_text": "The employee shall provide a written notice period of sixty days prior to voluntary resignation.",
            "explanation": "If you decide to quit, you must let the company know in writing at least 60 days before your final day.",
            "risk_level": "Medium",
            "risk_explanation": "A 60-day notice is longer than the typical 2-week standard. This may delay your start date at a new job."
        },
        {
            "clause_title": "Non-Compete Covenant",
            "original_text": "For a period of 12 months following termination, the employee shall not engage in any activity competitive with the employer within a 50-mile radius.",
            "explanation": "For one year after leaving this job, you cannot work for a competitor or start a competing business within 50 miles of your office.",
            "risk_level": "High",
            "risk_explanation": "This restricts your career mobility. Non-competes can prevent you from finding local employment in your field."
        },
        {
            "clause_title": "Intellectual Property Ownership",
            "original_text": "All inventions, software code, and processes created by the employee during working hours belong exclusively to the company.",
            "explanation": "Any work, code, or ideas you create while working for this company belong to them, not you.",
            "risk_level": "Low",
            "risk_explanation": "This is a standard industry practice. Just make sure not to work on personal side projects during company time."
        },
        {
            "clause_title": "Governing Jurisdiction",
            "original_text": "This agreement shall be interpreted in accordance with the laws of the State of Delaware, and any disputes shall be arbitrated therein.",
            "explanation": "If there is a lawsuit or dispute, it will be handled in Delaware under Delaware laws, regardless of where you live.",
            "risk_level": "Medium",
            "risk_explanation": "If you reside elsewhere, traveling to Delaware for legal proceedings or arbitration could be costly and inconvenient."
        }
    ]
}

def analyze_legal_document(text_content: str, file_bytes: Optional[bytes] = None, mime_type: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    model = get_gemini_model(api_key)
    
    if not model:
        # Fallback to realistic mock data
        print("Using Mock Legal Analyzer")
        return MOCK_LEGAL_RESPONSE
    
    try:
        prompt = "Analyze this legal agreement:\n" + text_content if text_content else "Analyze this uploaded contract image."
        
        contents = []
        if file_bytes and mime_type:
            contents.append({
                "mime_type": mime_type,
                "data": file_bytes
            })
        contents.append(prompt)
        
        # Call Gemini in JSON mode
        response = model.generate_content(
            contents,
            generation_config={"response_mime_type": "application/json"},
            system_instruction=LEGAL_SYSTEM_PROMPT
        )
        
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini legal analysis failed: {str(e)}. Falling back to mock data.")
        return MOCK_LEGAL_RESPONSE


# ---------------------------------------------------------
# RAG Chat Question Answering
# ---------------------------------------------------------

CHAT_SYSTEM_PROMPT = """
You are a highly capable AI assistant helping a user understand their uploaded document.
The document type is: {doc_type}
The document content context is:
---
{context}
---

Rules:
1. Answer the user's questions truthfully and accurately based ONLY on the provided context from the document.
2. If the answer cannot be found in the document context, state: "I couldn't find that information in the uploaded document." Do not make up facts.
3. If this is a Medical Document:
   - NEVER diagnose diseases or prescribe treatments.
   - Show disclaimer: "This information is educational only and not a medical diagnosis."
4. If this is a Legal Document:
   - NEVER provide formal legal advice.
   - Explain terms clearly and advise consulting a lawyer for actual legal choices.
5. Keep your tone professional, empathetic, and objective.
"""

def generate_chat_response(
    query: str, 
    context_chunks: List[str], 
    doc_type: str, 
    history: List[Dict[str, str]], 
    api_key: Optional[str] = None
) -> str:
    model = get_gemini_model(api_key)
    context = "\n\n".join(context_chunks)
    
    # Format chat history for Gemini
    formatted_history = []
    # If using system_instruction, we don't need to inject it as a message, but we can set it.
    
    system_instruction = CHAT_SYSTEM_PROMPT.format(doc_type=doc_type, context=context)
    
    if not model:
        # Mock answers based on keyword search
        query_lower = query.lower()
        if "vitamin" in query_lower:
            return "Based on your report, your Vitamin D is 15.0 ng/mL, which is below the normal range of 30.0 - 100.0 ng/mL. This is considered a deficiency. You should consult a doctor to see if supplements are needed. *Disclaimer: This information is educational only and not a medical diagnosis.*"
        elif "hemoglobin" in query_lower:
            return "Your hemoglobin is 10.5 g/dL, which is slightly lower than the normal range of 12.0 - 16.0 g/dL. This is flaggged as 'Low'. It may indicate mild anemia, which can cause fatigue. A doctor can recommend dietary changes or iron supplements. *Disclaimer: This information is educational only and not a medical diagnosis.*"
        elif "non-compete" in query_lower or "compete" in query_lower:
            return "According to the contract, there is a Non-Compete Covenant. It lasts for 12 months after your employment ends and prevents you from competing within a 50-mile radius of the company's offices. This is a High risk item. Please check with a lawyer to understand its enforceability."
        elif "notice" in query_lower or "terminate" in query_lower:
            return "The document states that you need to give a written notice of 60 days before resigning. The employer can terminate the agreement immediately without notice only if it is 'For Cause'."
        else:
            return f"I see you're asking about '{query}' while in Demo Mode. To get real AI-powered answers analyzed from your actual uploaded document, please add your **Google Gemini API Key** by clicking **AI API Settings** in the bottom-left sidebar. *(Disclaimer: This is a demo fallback)*"

    try:
        # Prepare the model with the instruction
        prompt = f"Previous Chat History:\n"
        for msg in history:
            role = "User" if msg["sender"] == "user" else "AI"
            prompt += f"{role}: {msg['message_text']}\n"
        prompt += f"\nNew Question: {query}\nAnswer:"
        
        response = model.generate_content(
            prompt,
            system_instruction=system_instruction
        )
        return response.text
    except Exception as e:
        print(f"Chat generation failed: {str(e)}")
        return "I'm sorry, I encountered an error while processing your request. Please try again or check your API key."
