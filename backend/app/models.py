from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "medical" or "legal"
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    text_content = Column(Text, nullable=True)
    summary_json = Column(Text, nullable=True)  # Store structured summary

    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    medical_tests = relationship("MedicalTest", back_populates="document", cascade="all, delete-orphan")
    legal_clauses = relationship("LegalClause", back_populates="document", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=False)  # JSON string of float embedding vector

    document = relationship("Document", back_populates="chunks")


class MedicalTest(Base):
    __tablename__ = "medical_tests"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    category = Column(String, default="General Pathology")
    test_name = Column(String, nullable=False)
    result_val = Column(String, nullable=False)  # e.g. "10.5" or "Positive"
    unit = Column(String, nullable=True)        # e.g. "g/dL"
    normal_range = Column(String, nullable=True) # e.g. "12-16"
    status = Column(String, nullable=False)     # "Normal", "Low", "High", "Borderline", "Critical", "Attention"
    explanation = Column(Text, nullable=True)
    interpretation = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    confidence = Column(String, default="high") # "high", "medium", "low"

    document = relationship("Document", back_populates="medical_tests")



class LegalClause(Base):
    __tablename__ = "legal_clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    clause_title = Column(String, nullable=False)      # e.g. "Notice Period", "Arbitration"
    original_text = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)         # Plain English translation
    risk_level = Column(String, nullable=False)        # "Low", "Medium", "High"
    risk_explanation = Column(Text, nullable=True)

    document = relationship("Document", back_populates="legal_clauses")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    document = relationship("Document", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    sender = Column(String, nullable=False)  # "user" or "ai"
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")
