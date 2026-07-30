import React, { useState, useEffect } from 'react';
import { useAPI } from '../context/APIContext';
import { 
  GitCompare, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Loader2,
  Calendar,
  AlertTriangle,
  Info,
  Activity,
  Heart
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function Comparison() {
  const api = useAPI();
  const [medicalDocs, setMedicalDocs] = useState([]);
  const [doc1Id, setDoc1Id] = useState('');
  const [doc2Id, setDoc2Id] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [selectedChartTest, setSelectedChartTest] = useState('');

  useEffect(() => {
    fetchMedicalDocs();
  }, []);

  const fetchMedicalDocs = async () => {
    try {
      setLoadingDocs(true);
      const docs = await api.getDocuments('medical');
      setMedicalDocs(docs);
    } catch (err) {
      console.error('Error fetching medical docs:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id) return;
    if (doc1Id === doc2Id) {
      alert('Please select two different reports to compare.');
      return;
    }

    try {
      setComparing(true);
      const res = await api.compareReports(doc1Id, doc2Id);
      setComparisonResult(res);

      // Auto-select the first test in improvements/worsenings/stables for the chart
      const allTests = [...res.improvements, ...res.worsenings, ...res.stables];
      if (allTests.length > 0) {
        setSelectedChartTest(allTests[0].test_name);
      } else {
        setSelectedChartTest('');
      }
    } catch (err) {
      console.error('Comparison failed:', err);
      alert('Failed to generate report comparison.');
    } finally {
      setComparing(false);
    }
  };

  // Prepare chart data for selected test
  const getChartData = () => {
    if (!comparisonResult || !selectedChartTest) return [];
    
    const allItems = [
      ...comparisonResult.improvements,
      ...comparisonResult.worsenings,
      ...comparisonResult.stables
    ];
    const match = allItems.find(t => t.test_name === selectedChartTest);
    if (!match) return [];

    const date1 = new Date(comparisonResult.report1_date).toLocaleDateString();
    const date2 = new Date(comparisonResult.report2_date).toLocaleDateString();

    const val1 = parseFloat(match.report1_val) || 0;
    const val2 = parseFloat(match.report2_val) || 0;

    return [
      { name: `Report 1 (${date1})`, [selectedChartTest]: val1 },
      { name: `Report 2 (${date2})`, [selectedChartTest]: val2 }
    ];
  };

  const chartData = getChartData();
  const allTestsList = comparisonResult 
    ? [...comparisonResult.improvements, ...comparisonResult.worsenings, ...comparisonResult.stables]
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Compare Medical Reports</h2>
        <p className="text-slate-500 text-sm">Select two medical reports to observe progress, regressions, or stable trends in parameters over time.</p>
      </div>

      {/* DOCUMENT SELECTOR PANEL */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        {loadingDocs ? (
          <div className="flex items-center justify-center py-6 gap-3">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading reports...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Report 1 (Earlier)</label>
              <select
                value={doc1Id}
                onChange={(e) => setDoc1Id(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Select older report...</option>
                {medicalDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({new Date(doc.uploaded_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Report 2 (Later)</label>
              <select
                value={doc2Id}
                onChange={(e) => setDoc2Id(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Select newer report...</option>
                {medicalDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename} ({new Date(doc.uploaded_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompare}
              disabled={comparing || !doc1Id || !doc2Id}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary-600/10 hover:shadow-primary-600/20 flex items-center justify-center gap-2"
            >
              {comparing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitCompare className="w-4 h-4" />
              )}
              Compare Reports
            </button>
          </div>
        )}
      </div>

      {/* COMPARISON RESULTS */}
      {comparisonResult ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
          
          {/* Metadata banner */}
          <div className="p-4 bg-slate-800 text-white rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700 shadow-md">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Comparison Scope</p>
              <h3 className="text-sm font-bold flex items-center gap-2">
                {comparisonResult.report1_filename}
                <ChevronRight className="w-4 h-4 text-slate-500" />
                {comparisonResult.report2_filename}
              </h3>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                {new Date(comparisonResult.report1_date).toLocaleDateString()}
              </span>
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full self-center"></span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                {new Date(comparisonResult.report2_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* DELTA CARDS (Improvements / Worsenings / Stables) */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Improvements Column */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3.5 py-2 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-650" />
                  Improved Values
                </span>
                <span className="bg-emerald-250/60 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {comparisonResult.improvements.length}
                </span>
              </div>
              <div className="space-y-3">
                {comparisonResult.improvements.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-xs text-slate-800">{item.test_name}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-405">{item.report1_val}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                      <span className="font-mono font-bold text-emerald-650">{item.report2_val} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">{item.explanation}</p>
                  </div>
                ))}
                {comparisonResult.improvements.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-6">No improved values recorded.</p>
                )}
              </div>
            </div>

            {/* Worsenings Column */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="bg-red-50 text-red-800 border border-red-100 px-3.5 py-2 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-red-650" />
                  Worsened Values
                </span>
                <span className="bg-red-250/60 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {comparisonResult.worsenings.length}
                </span>
              </div>
              <div className="space-y-3">
                {comparisonResult.worsenings.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-xs text-slate-800">{item.test_name}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-405">{item.report1_val}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                      <span className="font-mono font-bold text-red-650">{item.report2_val} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span></span>
                    </div>
                    <p className="text-[10px] text-red-900 bg-red-50/20 border border-red-100/30 p-2 rounded-lg leading-relaxed mt-1.5">
                      <strong>AI Review:</strong> {item.explanation}
                    </p>
                  </div>
                ))}
                {comparisonResult.worsenings.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-6">No worsening values recorded.</p>
                )}
              </div>
            </div>

            {/* Stables Column */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="bg-slate-100 text-slate-850 border border-slate-200 px-3.5 py-2 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-slate-500" />
                  Stable Values
                </span>
                <span className="bg-slate-200/60 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {comparisonResult.stables.length}
                </span>
              </div>
              <div className="space-y-3">
                {comparisonResult.stables.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-xs text-slate-800">{item.test_name}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-405">{item.report1_val}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
                      <span className="font-mono font-bold text-slate-750">{item.report2_val} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span></span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5">{item.explanation}</p>
                  </div>
                ))}
                {comparisonResult.stables.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic text-center py-6">No stable values recorded.</p>
                )}
              </div>
            </div>

          </div>

          {/* DYNAMIC TREND GRAPH IN RECHARTS */}
          {allTestsList.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-500" />
                    Comparative Trend Analysis
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Select a parameter to view the timeline shift</p>
                </div>

                <select
                  value={selectedChartTest}
                  onChange={(e) => setSelectedChartTest(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-primary-500 transition-colors max-w-xs"
                >
                  {allTestsList.map((test) => (
                    <option key={test.test_name} value={test.test_name}>
                      {test.test_name}
                    </option>
                  ))}
                </select>
              </div>

              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '11px', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' 
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar 
                        dataKey={selectedChartTest} 
                        fill="#0e90eb" 
                        radius={[8, 8, 0, 0]} 
                        maxBarSize={60} 
                        name={`${selectedChartTest} value`}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-10">No numeric data available for this parameter chart.</p>
              )}
            </div>
          )}

          {/* Educational Disclaimer */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 text-amber-850 text-xs rounded-xl flex items-start gap-3 shadow-inner">
            <Heart className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Medical Disclaimer</p>
              <p className="mt-0.5 text-slate-600">
                This comparison is educational only and does not represent professional medical diagnosis or clinical tracking. Please discuss your test trends and results directly with a qualified doctor.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="bg-slate-50 p-4 rounded-full text-slate-400 w-fit mx-auto border border-slate-100">
            <GitCompare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-850">Select reports to begin</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Select two medical reports from the dropdown menus above and click "Compare Reports" to view their parameter trends.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
