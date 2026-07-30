import React, { useState, useEffect, useRef } from 'react';
import { useAPI } from '../context/APIContext';
import { MessageSquare, Send, Loader2, Sparkles, X, Plus, AlertCircle } from 'lucide-react';

export default function ChatPanel({ documentId, fileType, isOpen, onClose }) {
  const api = useAPI();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchSessions();
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await api.getChatSessions(documentId);
      setSessions(res);
      if (res.length > 0) {
        setActiveSession(res[0]);
      } else {
        // Automatically create a session if none exist
        handleCreateSession();
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      setLoadingMessages(true);
      const res = await api.getChatSession(sessionId);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoadingSessions(true);
      const session = await api.createChatSession(documentId);
      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || sending) return;

    const userText = input.trim();
    setInput('');
    setSending(true);

    // Append user message locally immediately for quick UI update
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message_text: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const aiResponse = await api.sendChatMessage(activeSession.id, userText);
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, aiResponse]);
    } catch (err) {
      console.error('Error sending message:', err);
      // Append error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          message_text: "Sorry, I couldn't generate a response. Please double-check your API key settings or try again.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
      {/* PANEL HEADER */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="font-bold text-sm">AI Document Assistant</h3>
            <p className="text-[10px] text-slate-400">Retrieval-Augmented Chat (RAG)</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* SESSIONS BAR */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {sessions.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide border shrink-0 transition-all ${
                activeSession?.id === s.id
                  ? 'bg-primary-600 border-primary-500 text-white shadow-md'
                  : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              Session {sessions.length - idx}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreateSession}
          disabled={loadingSessions}
          className="p-1.5 bg-slate-800 border border-slate-750 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg transition-colors shrink-0"
          title="New Chat Session"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MESSAGES VIEW */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-900/20">
        {/* Warning Banner */}
        <div className="p-3.5 bg-slate-850/80 border border-slate-800 rounded-xl text-[10px] text-slate-450 leading-relaxed flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
          <span>
            {fileType === 'medical' 
              ? 'This information is educational only and not a medical diagnosis. Responses are grounded only in the uploaded medical report.' 
              : 'This is educational analysis only, not legal advice. Responses are generated based only on the uploaded agreement.'
            }
          </span>
        </div>

        {loadingMessages ? (
          <div className="py-20 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            <p className="text-[10px] text-slate-500 font-bold">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2.5 max-w-xs mx-auto">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-700" />
            <p className="text-xs font-bold text-slate-400">Ask questions about this report</p>
            <p className="text-[10px] leading-relaxed text-slate-500">
              {fileType === 'medical'
                ? "Try: 'Why is my Vitamin D low?', 'What tests do I need to follow up on?', 'Explain my hemoglobin result.'"
                : "Try: 'What is my notice period?', 'Are there any non-compete clauses?', 'When does this contract end?'"
              }
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-primary-650 text-white rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 border border-slate-750 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-line">{msg.message_text}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-semibold px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex flex-col items-start">
            <div className="bg-slate-800 text-slate-400 border border-slate-750 rounded-2xl rounded-tl-sm px-4 py-3 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* INPUT FORM */}
      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-slate-850 bg-slate-950 shrink-0 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the document..."
          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder:text-slate-650"
          disabled={sending || !activeSession}
        />
        <button
          type="submit"
          className="bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white p-3 rounded-xl shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          disabled={!input.trim() || sending || !activeSession}
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
