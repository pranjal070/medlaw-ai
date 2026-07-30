import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAPI } from '../context/APIContext';
import { 
  Activity, 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  Heart,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function MedicalAnalyzer() {
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
    } else {
      // If no ID is provided, redirect to dashboard or show a select list
      setLoading(false);
    }
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      const doc = await api.getDocument(id);
      setDocument(doc);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document analysis details. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs text-slate-450 font-bold">Retrieving health reports...</p>
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
          <p className="text-sm font-bold text-slate-800">{error || 'Report Details Not Found'}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Please make sure you selected a valid medical document from your dashboard.
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
    overall_health: 'No summary parsed',
    key_findings: [],
    abnormal_parameters: [],
    recommendations: [],
    attention_tests: []
  };

  try {
    if (document.summary_json) {
      summary = JSON.parse(document.summary_json);
    }
  } catch (e) {
    console.error('Error parsing summary json:', e);
  }

  // Metrics Calculations
  const tests = document.medical_tests || [];
  const normalTests = tests.filter(t => t.status === 'Normal');
  const lowTests = tests.filter(t => t.status === 'Low');
  const highTests = tests.filter(t => t.status === 'High');
  const attentionTests = tests.filter(t => t.status === 'Attention');
  const abnormalCount = lowTests.length + highTests.length + attentionTests.length;

  // Health Score (Base 100, deduct 15 points per abnormal parameter, capped at 20 min)
  const healthScore = Math.max(20, 100 - (abnormalCount * 15));

  // Recharts Health Score Chart data
  const chartData = [
    { name: 'Score', value: healthScore, color: healthScore > 75 ? '#0272ca' : healthScore > 50 ? '#d97706' : '#dc2626' },
    { name: 'Remaining', value: 100 - healthScore, color: '#f1f5f9' }
  ];

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

      {/* METRICS & OVERALL HEALTH DASHBOARD */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 self-start">Calculated Health Score</h3>
          <p className="text-[10px] text-slate-400 self-start mt-0.5">Based on abnormal test parameters</p>
          
          <div className="w-40 h-40 mt-4 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={chartData[0].color} />
                  <Cell fill={chartData[1].color} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Overlay Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800">{healthScore}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Index Score</span>
            </div>
          </div>

          <div className="mt-4 flex gap-4 text-xs font-bold text-slate-650">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-primary-500 rounded-full"></span>
              Normal Range
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              Out of Bounds
            </div>
          </div>
        </div>

        {/* Health Status & Recommendations Summary */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="bg-primary-50 text-primary-650 text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border border-primary-100">
                AI Synthesis Summary
              </span>
              <h3 className="text-lg font-bold text-slate-850 mt-2">Overall Health Outlook</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {summary.overall_health || "AI summary generation could not parse valid details."}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xl font-extrabold text-emerald-600">{normalTests.length}</p>
              <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1">Normal</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-blue-600">{lowTests.length}</p>
              <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1">Low Values</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-red-500">{highTests.length}</p>
              <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1">High Values</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-amber-500">{attentionTests.length}</p>
              <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wide mt-1">Attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* DISCLAIMER BAR */}
      <div className="p-4 bg-amber-50/50 border border-amber-200/80 text-amber-800 text-xs rounded-xl flex items-start gap-3 shadow-inner">
        <Heart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Medical Educational Disclaimer</p>
          <p className="mt-0.5 text-slate-600">
            This information is educational only and not a medical diagnosis. Never ignore professional medical advice or delay seeking treatment because of something you read here. Always consult a qualified healthcare provider.
          </p>
        </div>
      </div>

      {/* DETAILED TESTS TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Extracted Test Parameters</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Structured tabular format of laboratory parameters</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3">Test Parameter</th>
                <th className="px-6 py-3">Result</th>
                <th className="px-6 py-3">Reference Range</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">AI Explanation Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {tests.map((test) => {
                let badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                if (test.status === 'Low') badgeClass = 'bg-blue-50 text-blue-700 border border-blue-100';
                else if (test.status === 'High') badgeClass = 'bg-red-50 text-red-700 border border-red-100';
                else if (test.status === 'Attention') badgeClass = 'bg-amber-50 text-amber-700 border border-amber-100';

                return (
                  <tr key={test.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4 font-bold text-slate-800">{test.test_name}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-700">
                      {test.result_val} <span className="text-[10px] text-slate-400 font-normal">{test.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{test.normal_range || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-sm leading-relaxed">{test.explanation || 'No explanation generated.'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* HEALTH INSIGHTS AND ADVISORY CARDS */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Key Findings */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Key Observations
          </h3>
          <ul className="space-y-3">
            {summary.key_findings.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary-650" />
            Suggested Lifestyle Tips
          </h3>
          <ul className="space-y-3">
            {summary.recommendations.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full shrink-0 mt-1.5"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
