import React, { useState, useEffect } from 'react';
import { useAPI } from '../context/APIContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Activity, 
  FileText, 
  Upload, 
  Search, 
  Trash2, 
  ExternalLink, 
  MessageSquare, 
  FilePlus2,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const api = useAPI();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') || 'medical';

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeTab, setActiveTab] = useState(queryTab);

  // Sync activeTab with URL query tab parameter
  useEffect(() => {
    if (queryTab === 'medical' || queryTab === 'legal') {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab, search]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await api.getDocuments(activeTab, search);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const doc = await api.uploadDocument(file, type);
      // Automatically redirect to the correct details page
      if (type === 'medical') {
        navigate(`/medical/${doc.id}`);
      } else {
        navigate(`/legal/${doc.id}`);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.response?.data?.detail || 'Document upload and analysis failed. Please verify the file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and all its chat logs?')) return;
    try {
      await api.deleteDocument(id);
      fetchDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Compute counts
  const medCount = documents.filter(d => d.file_type === 'medical').length;
  const legalCount = documents.filter(d => d.file_type === 'legal').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Your Intelligence Dashboard</h2>
        <p className="text-slate-500 text-sm">Upload, review, and converse with medical reports and legal contracts instantly.</p>
      </div>

      {/* ERROR BANNER */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Analysis Failed</p>
            <p className="mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      {/* TAB SELECTOR */}
      <div className="flex justify-center">
        <div className="bg-slate-200/60 p-1.5 rounded-2xl flex gap-1 border border-slate-300/40 shadow-inner">
          <button
            onClick={() => handleTabChange('medical')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'medical'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Medical Report
          </button>
          <button
            onClick={() => handleTabChange('legal')}
            className={`px-8 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'legal'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Legal Contract
          </button>
        </div>
      </div>

      {/* SINGLE UPLOADER AREA */}
      <div className="max-w-xl mx-auto">
        {activeTab === 'medical' ? (
          /* Medical Upload */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-350 transition-all duration-300 min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[120px] pointer-events-none group-hover:bg-slate-100/50 transition-colors"></div>
            
            <div className="z-10 space-y-5">
              <div className="bg-slate-100 p-3.5 rounded-2xl text-slate-800 w-fit border border-slate-200">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Medical Report Analyzer</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Extract values into a structured table, calculate health scores, identify risks, and translate abnormal metrics. Supports PDF, DOCX, JPG, and PNG scans.
                </p>
              </div>
            </div>

            <div className="mt-8 z-10">
              <label className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Medical Report
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" 
                  className="hidden" 
                  onChange={(e) => handleUpload(e, 'medical')}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Legal Upload */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-350 transition-all duration-300 min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[120px] pointer-events-none group-hover:bg-slate-100/50 transition-colors"></div>
            
            <div className="z-10 space-y-5">
              <div className="bg-slate-100 p-3.5 rounded-2xl text-slate-800 w-fit border border-slate-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Legal Contract Analyzer</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Summarize obligations, extract key dates, automatically sort clauses by risk levels (Low/Medium/High), and translate complex legalese.
                </p>
              </div>
            </div>

            <div className="mt-8 z-10">
              <label className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-slate-900 hover:bg-slate-850 active:bg-slate-950 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Legal Document
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" 
                  className="hidden" 
                  onChange={(e) => handleUpload(e, 'legal')}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* HISTORY TABLE / CARD LIST */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Upload History
            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-full border border-slate-100">
              {documents.length}
            </span>
          </h3>

          {/* Search Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder:text-slate-400 w-48 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="py-16 flex flex-col justify-center items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Fetching history...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
            <div className="bg-slate-50 p-4 rounded-full text-slate-400 w-fit mx-auto border border-slate-100">
              <FilePlus2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No documents found</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload your first medical report or legal agreement above to start extracting and questioning data with AI.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => navigate(doc.file_type === 'medical' ? `/medical/${doc.id}` : `/legal/${doc.id}`)}
                className="p-5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    doc.file_type === 'medical' 
                      ? 'bg-primary-50 text-primary-650' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {doc.file_type === 'medical' ? <Activity className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{doc.filename}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                      <span className={`uppercase text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wider ${
                        doc.file_type === 'medical'
                          ? 'bg-primary-50 text-primary-600 border border-primary-100'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {doc.file_type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-650 rounded-xl transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                  <div className="p-2 text-slate-350 hover:text-slate-500">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
