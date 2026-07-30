import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAPI } from '../context/APIContext';
import { 
  FileText, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle,
  ShieldAlert,
  Loader2,
  Scale,
  Calendar,
  AlertCircle,
  Clock,
  Briefcase,
  DollarSign
} from 'lucide-react';

export default function LegalAnalyzer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useAPI();
  const [searchParams] = useSearchParams();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDocumentDetails();
    }
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const doc = await api.getDocument(id);
      setDocument(doc);
    } catch (err) {
      console.error('Error fetching document details:', err);
      setError('Failed to load document analysis details. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
        <p className="text-xs text-slate-450 font-bold font-mono">Reviewing legal covenants...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="bg-red-50 p-4 rounded-full text-red-650 w-fit mx-auto border border-red-100 animate-pulse">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{error || 'Agreement Details Not Found'}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Please make sure you selected a valid legal document from your dashboard.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Parse structured summary JSON
  let summary = {
    document_type: 'Unknown',
    purpose: '',
    key_dates: [],
    responsibilities: [],
    payment_terms: '',
    termination_conditions: ''
  };

  try {
    if (document.summary_json) {
      summary = JSON.parse(document.summary_json);
    }
  } catch (e) {
    console.error('Error parsing summary json:', e);
  }

  const clauses = document.legal_clauses || [];
  const lowRiskClauses = clauses.filter(c => c.risk_level === 'Low');
  const medRiskClauses = clauses.filter(c => c.risk_level === 'Medium');
  const highRiskClauses = clauses.filter(c => c.risk_level === 'High');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          Back to Dashboard
        </button>
      </div>

      {/* OVERVIEW SECTION & METRIC BLOCKS */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document type & main stats */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[100px] pointer-events-none"></div>
          
          <div className="space-y-4">
            <span className="bg-white/10 text-white text-[9px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border border-white/5">
              Parsed Classification
            </span>
            <div>
              <h3 className="text-xl font-extrabold">{summary.document_type || 'Legal Document'}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{summary.purpose}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
              <p className="text-base font-extrabold text-red-450">{highRiskClauses.length}</p>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wide mt-1">High Risks</p>
            </div>
            <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
              <p className="text-base font-extrabold text-amber-400">{medRiskClauses.length}</p>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wide mt-1">Med Risks</p>
            </div>
            <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800">
              <p className="text-base font-extrabold text-emerald-450">{lowRiskClauses.length}</p>
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wide mt-1">Low Risks</p>
            </div>
          </div>
        </div>

        {/* Covenants Details Matrix */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4.5 h-4.5 text-primary-500 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Key Milestones & Dates</h4>
            </div>
            <ul className="space-y-2 pl-6 list-disc text-slate-600 text-xs leading-relaxed">
              {summary.key_dates.map((date, idx) => (
                <li key={idx}>{date}</li>
              ))}
            </ul>

            <div className="flex items-center gap-2 text-slate-700 pt-2">
              <DollarSign className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Payment & Value terms</h4>
            </div>
            <p className="text-xs text-slate-500 pl-6 leading-relaxed">
              {summary.payment_terms || 'No financial terms mentioned.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4.5 h-4.5 text-primary-500 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Termination Conditions</h4>
            </div>
            <p className="text-xs text-slate-500 pl-6 leading-relaxed">
              {summary.termination_conditions || 'No exit criteria specified.'}
            </p>

            <div className="flex items-center gap-2 text-slate-700 pt-2">
              <Briefcase className="w-4.5 h-4.5 text-slate-600 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Primary Responsibilities</h4>
            </div>
            <ul className="space-y-1.5 pl-6 list-decimal text-slate-600 text-xs leading-relaxed">
              {summary.responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* LEGAL WARNING BAR */}
      <div className="p-4 bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl flex items-start gap-3 shadow-inner">
        <Scale className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Legal Notice Disclaimer</p>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            MedLaw AI explains legalese in plain language but does not provide formal legal advice. Contract evaluation and risk ratings are automated insights. Always consult a qualified attorney for legal counsel, drafting, or before signing binding agreements.
          </p>
        </div>
      </div>

      {/* RISK ASSESSMENT BOARD */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800">Covenant Risk Board</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Clauses categorized by severity of obligations and potential penalties</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* High Risk */}
          <div className="bg-red-50/20 border border-red-100 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-red-100/50 border border-red-200/50 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-red-750 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-650" />
                High Severity
              </span>
              <span className="bg-red-200/60 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {highRiskClauses.length}
              </span>
            </div>
            <div className="space-y-3">
              {highRiskClauses.map((clause) => (
                <div key={clause.id} className="bg-white border border-red-100/50 rounded-xl p-4 shadow-sm space-y-2">
                  <h4 className="font-bold text-xs text-slate-800">{clause.clause_title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic">"{clause.original_text}"</p>
                  <p className="text-[11px] text-red-850 leading-relaxed bg-red-50/50 p-2.5 rounded-lg border border-red-100/30">
                    <strong>AI Advice:</strong> {clause.risk_explanation || clause.explanation}
                  </p>
                </div>
              ))}
              {highRiskClauses.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No high-risk covenants found.</p>
              )}
            </div>
          </div>

          {/* Medium Risk */}
          <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-amber-100/50 border border-amber-200/50 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-amber-705 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-605" />
                Medium Severity
              </span>
              <span className="bg-amber-200/60 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {medRiskClauses.length}
              </span>
            </div>
            <div className="space-y-3">
              {medRiskClauses.map((clause) => (
                <div key={clause.id} className="bg-white border border-amber-100/50 rounded-xl p-4 shadow-sm space-y-2">
                  <h4 className="font-bold text-xs text-slate-800">{clause.clause_title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic">"{clause.original_text}"</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/30">
                    {clause.explanation}
                  </p>
                </div>
              ))}
              {medRiskClauses.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No medium-risk covenants found.</p>
              )}
            </div>
          </div>

          {/* Low Risk */}
          <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center bg-emerald-100/50 border border-emerald-200/50 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-emerald-750 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-655" />
                Low Severity
              </span>
              <span className="bg-emerald-200/60 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {lowRiskClauses.length}
              </span>
            </div>
            <div className="space-y-3">
              {lowRiskClauses.map((clause) => (
                <div key={clause.id} className="bg-white border border-emerald-100/50 rounded-xl p-4 shadow-sm space-y-2">
                  <h4 className="font-bold text-xs text-slate-800">{clause.clause_title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold italic">"{clause.original_text}"</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/30">
                    {clause.explanation}
                  </p>
                </div>
              ))}
              {lowRiskClauses.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-6">No low-risk covenants found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DUAL COLUMN LEGAL TRANSLATOR PANEL */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-850">Legalese Translator Split-View</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">AI-powered direct translation of contract terminology to plain English</p>
        </div>

        <div className="divide-y divide-slate-100">
          {clauses.map((clause) => (
            <div key={clause.id} className="p-6 grid md:grid-cols-2 gap-6 hover:bg-slate-50/30 transition-colors">
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">Original Clause Covenants</span>
                <h4 className="font-bold text-xs text-slate-800">{clause.clause_title}</h4>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <p className="text-xs text-slate-600 font-mono leading-relaxed">"{clause.original_text}"</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wide text-primary-500 font-bold">Simplified Plain-English Meaning</span>
                <h4 className="font-bold text-xs text-primary-650 flex items-center gap-1">
                  AI Translation Explanation
                </h4>
                <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-xl h-full flex items-center">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {clause.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
