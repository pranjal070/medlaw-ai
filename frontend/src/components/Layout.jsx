import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Activity, 
  FileText, 
  LayoutDashboard, 
  GitCompare, 
  LogOut, 
  Settings, 
  Key, 
  AlertTriangle,
  User,
  X,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { user, logout, geminiKey, setGeminiKey } = useAuth();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [tempKey, setTempKey] = useState(geminiKey);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Medical Analyzer', path: '/?tab=medical', icon: Activity },
    { name: 'Legal Analyzer', path: '/?tab=legal', icon: FileText },
    { name: 'Report Comparison', path: '/compare', icon: GitCompare },
  ];

  const handleSaveKey = (e) => {
    e.preventDefault();
    setGeminiKey(tempKey);
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-primary-500 p-2 rounded-xl text-white shadow-md shadow-primary-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">MedLaw AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const searchParams = new URLSearchParams(location.search);
            const currentTab = searchParams.get('tab');
            
            let isActive = false;
            if (item.path === '/') {
              isActive = location.pathname === '/' && !currentTab;
            } else if (item.path === '/?tab=medical') {
              isActive = location.pathname === '/' && currentTab === 'medical';
            } else if (item.path === '/?tab=legal') {
              isActive = location.pathname === '/' && currentTab === 'legal';
            } else {
              isActive = location.pathname === item.path;
            }
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/15' 
                    : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-500">Authorized User</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-850 hover:text-white text-slate-400 border border-slate-800 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            AI API Settings
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-red-950/40 hover:text-red-300 text-slate-400 hover:border-red-900/40 border border-transparent transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-bold text-slate-800">
            {menuItems.find(m => m.path === location.pathname)?.name || 'MedLaw AI Portal'}
          </h1>

          <div className="flex items-center gap-4">
            {/* API Mode Indicator */}
            {geminiKey ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live Gemini API Active
              </span>
            ) : (
              <span 
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 cursor-pointer hover:bg-amber-100/80 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Demo / Mock Mode
              </span>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8 bg-slate-50/50">
          {children}
        </main>
      </div>

      {/* SETTINGS MODAL (Gemini Key) */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary-50 p-2 rounded-lg text-primary-600">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-850">Gemini API Key</h3>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveKey}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your Gemini API key below to enable live summarization, test extraction, contract risk analysis, and RAG chats. The key is only sent from your browser to the local server and is not permanently saved.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    If no API key is provided, the application will run in <strong>Demo Mode</strong>, utilizing high-quality mock data engines for document analysis.
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTempKey('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Clear Key
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
