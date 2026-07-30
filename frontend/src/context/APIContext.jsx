import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const APIContext = createContext(null);

export const useAPI = () => useContext(APIContext);

export const APIProvider = ({ children }) => {
  const { API_URL, geminiKey } = useAuth();

  // Create an axios instance that automatically injects the Gemini key if provided
  const getClient = () => {
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (geminiKey) {
      headers['X-Gemini-Key'] = geminiKey;
    }
    return axios.create({
      baseURL: API_URL,
      headers
    });
  };

  // Upload document
  const uploadDocument = async (file, fileType) => {
    const client = getClient();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const response = await client.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  };

  // List all uploaded documents
  const getDocuments = async (fileType = null, search = '') => {
    const client = getClient();
    let url = '/documents';
    const params = [];
    if (fileType) params.push(`file_type=${fileType}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    const response = await client.get(url);
    return response.data;
  };

  // Get a single document details (including tests/clauses)
  const getDocument = async (id) => {
    const client = getClient();
    const response = await client.get(`/documents/${id}`);
    return response.data;
  };

  // Delete document
  const deleteDocument = async (id) => {
    const client = getClient();
    const response = await client.delete(`/documents/${id}`);
    return response.data;
  };

  // Compare two reports
  const compareReports = async (id1, id2) => {
    const client = getClient();
    const response = await client.get(`/documents/compare/${id1}/${id2}`);
    return response.data;
  };

  // Create new chat session
  const createChatSession = async (documentId) => {
    const client = getClient();
    const response = await client.post(`/chat/session?document_id=${documentId}`);
    return response.data;
  };

  // Get chat sessions for a document
  const getChatSessions = async (documentId) => {
    const client = getClient();
    const response = await client.get(`/chat/sessions/${documentId}`);
    return response.data;
  };

  // Get chat session details (messages)
  const getChatSession = async (sessionId) => {
    const client = getClient();
    const response = await client.get(`/chat/session/${sessionId}`);
    return response.data;
  };

  // Send message in RAG chat
  const sendChatMessage = async (sessionId, messageText) => {
    const client = getClient();
    const response = await client.post(`/chat/session/${sessionId}/message`, {
      message_text: messageText
    });
    return response.data;
  };

  const value = {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    compareReports,
    createChatSession,
    getChatSessions,
    getChatSession,
    sendChatMessage
  };

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};
