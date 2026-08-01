from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional, Dict, Any

# Authentication Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# Medical Test Schemas
class MedicalTestResponse(BaseModel):
    id: int
    document_id: int
    category: Optional[str] = "General Pathology"
    test_name: str
    result_val: str
    unit: Optional[str] = None
    normal_range: Optional[str] = None
    status: str
    explanation: Optional[str] = None
    interpretation: Optional[str] = None
    recommendation: Optional[str] = None
    confidence: Optional[str] = "high"

    class Config:
        from_attributes = True



# Legal Clause Schemas
class LegalClauseResponse(BaseModel):
    id: int
    document_id: int
    clause_title: str
    original_text: str
    explanation: str
    risk_level: str
    risk_explanation: Optional[str] = None

    class Config:
        from_attributes = True


# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_type: str
    uploaded_at: datetime
    summary_json: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    text_content: Optional[str] = None
    medical_tests: List[MedicalTestResponse] = []
    legal_clauses: List[LegalClauseResponse] = []


# Chat Schemas
class ChatMessageCreate(BaseModel):
    message_text: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    message_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

class ChatSessionListResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


# Comparison Schemas
class TestComparisonItem(BaseModel):
    test_name: str
    report1_val: Optional[str] = None
    report2_val: Optional[str] = None
    unit: Optional[str] = None
    status1: Optional[str] = None
    status2: Optional[str] = None
    change_type: str  # "improved", "worsened", "stable", "new", "unknown"
    explanation: str

class ComparisonResponse(BaseModel):
    report1_filename: str
    report2_filename: str
    report1_date: datetime
    report2_date: datetime
    improvements: List[TestComparisonItem] = []
    worsenings: List[TestComparisonItem] = []
    stables: List[TestComparisonItem] = []
