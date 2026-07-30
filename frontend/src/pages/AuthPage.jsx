import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity, User, Mail, Lock, Loader2, Info } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setSubmitting(true);

    const result = isLogin 
      ? await login(email, password) 
      : await register(email, password);

    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden px-4">
      {/* Background visual effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/20 text-white">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            MedLaw <span className="text-primary-400 font-semibold">AI</span>
          </span>
        </div>

        {/* Card Panel */}
        <div className="glass-panel-dark p-8 rounded-2xl shadow-2xl relative border border-slate-800">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-slate-400 rounded-t-2xl"></div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isLogin 
              ? 'Access your medical reports and legal contracts analyzer.' 
              : 'Sign up to start analyzing health and legal documents.'
            }
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/60 text-red-200 text-xs rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-600"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-600"
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-primary-600/10 flex items-center justify-center gap-2 hover:shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-900 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
              disabled={submitting}
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className="mt-8 text-center text-slate-600 text-[11px] leading-relaxed max-w-sm mx-auto">
          MedLaw AI delivers educational insights and document parses. It does not provide medical diagnoses or legal advice.
        </p>
      </div>
    </div>
  );
}
