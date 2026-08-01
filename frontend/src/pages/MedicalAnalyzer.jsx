import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Plus,
  Utensils,
  Ban,
  ShieldAlert,
  Check,
  Stethoscope,
  Search,
  Filter,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  Eye,
  Printer,
  Sparkles,
  Scale,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function MedicalAnalyzer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useAPI();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'Normal', 'High', 'Low', 'Attention'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [openCategories, setOpenCategories] = useState({});
  const [selectedTestModal, setSelectedTestModal] = useState(null);

  useEffect(() => {
    if (id) {
      fetchDocumentDetails();
    } else {
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

  // Parse summary JSON safely
  const summary = useMemo(() => {
    let baseSummary = {
      overall_health: 'No summary parsed',
      health_decision: 'Routine Monitoring Recommended',
      health_score: 85,
      key_findings: [],
      abnormal_parameters: [],
      major_abnormalities: [],
      normal_findings: [],
      possible_health_risks: [],
      lifestyle_recommendations: [],
      diet_recommendations: [],
      avoid_recommendations: [],
      exercise_recommendations: [],
      followup_tests: [],
      when_to_consult_physician: 'Consult your primary physician if flagged parameters persist or symptoms develop.',
      precautions: [],
      what_to_eat: [],
      what_to_stop: []
    };

    if (document?.summary_json) {
      try {
        const parsed = JSON.parse(document.summary_json);
        return { ...baseSummary, ...parsed };
      } catch (e) {
        console.error('Error parsing summary json:', e);
      }
    }
    return baseSummary;
  }, [document]);

  const tests = useMemo(() => document?.medical_tests || [], [document]);

  // Derived Metrics & Categories
  const { normalTests, lowTests, highTests, attentionTests, categories, categoryMap } = useMemo(() => {
    const normal = [];
    const low = [];
    const high = [];
    const attention = [];
    const catMap = {};

    tests.forEach(t => {
      const cat = t.category || 'General Pathology';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(t);

      if (t.status === 'Normal') normal.push(t);
      else if (t.status === 'Low') low.push(t);
      else if (t.status === 'High') high.push(t);
      else attention.push(t);
    });

    return {
      normalTests: normal,
      lowTests: low,
      highTests: high,
      attentionTests: attention,
      categories: Object.keys(catMap),
      categoryMap: catMap
    };
  }, [tests]);

  // Auto-expand all categories on load
  useEffect(() => {
    if (categories.length > 0) {
      const initialMap = {};
      categories.forEach(cat => { initialMap[cat] = true; });
      setOpenCategories(initialMap);
    }
  }, [categories]);

  // Health Score Calculation
  const abnormalCount = lowTests.length + highTests.length + attentionTests.length;
  const calculatedScore = summary.health_score || Math.max(20, 100 - (abnormalCount * 10));

  // Chart Data
  const pieChartData = [
    { name: 'Normal (Correct)', value: normalTests.length, color: '#10b981' },
    { name: 'High Value', value: highTests.length, color: '#ef4444' },
    { name: 'Low Value', value: lowTests.length, color: '#3b82f6' },
    { name: 'Attention Needed', value: attentionTests.length, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const barChartData = useMemo(() => {
    const abnormalList = [...highTests, ...lowTests, ...attentionTests];
    return abnormalList.slice(0, 8).map(t => ({
      name: t.test_name.length > 15 ? t.test_name.substring(0, 15) + '...' : t.test_name,
      Value: parseFloat(t.result_val) || 1,
      status: t.status
    }));
  }, [highTests, lowTests, attentionTests]);

  // Filtering Logic
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const matchesSearch = 
        t.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.result_val && t.result_val.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'ALL' || 
        t.status === statusFilter || 
        (statusFilter === 'ABNORMAL' && t.status !== 'Normal');

      const matchesCategory = 
        categoryFilter === 'ALL' || t.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tests, searchQuery, statusFilter, categoryFilter]);

  // Toggle Category Accordion
  const toggleCategory = (cat) => {
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Export as JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(document, null, 2));
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${document.filename.replace(/\.[^/.]+$/, "")}_analysis.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export as CSV
  const handleExportCSV = () => {
    const headers = ["Category", "Test Name", "Observed Value", "Unit", "Reference Range", "Evaluation Status", "Confidence", "Interpretation", "Recommendation"];
    const rows = tests.map(t => [
      `"${t.category || 'General Pathology'}"`,
      `"${t.test_name}"`,
      `"${t.result_val}"`,
      `"${t.unit || ''}"`,
      `"${t.normal_range || ''}"`,
      `"${t.status}"`,
      `"${t.confidence || 'high'}"`,
      `"${(t.interpretation || t.explanation || '').replace(/"/g, '""')}"`,
      `"${(t.recommendation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${document.filename.replace(/\.[^/.]+$/, "")}_pathology_report.csv`);
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Print PDF View
  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Extracting multi-page pathology report parameters...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="bg-red-50 p-4 rounded-full text-red-600 w-fit mx-auto border border-red-100 animate-pulse">
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

  // Decision Badge Class
  let decisionBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let decisionText = summary.health_decision || "Routine Health Screening";
  if (abnormalCount >= 3 || decisionText.includes("Urgently")) {
    decisionBadgeClass = "bg-red-50 text-red-700 border-red-200";
  } else if (abnormalCount >= 1 || decisionText.includes("Attention")) {
    decisionBadgeClass = "bg-amber-50 text-amber-800 border-amber-200";
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* TOP ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* AI Decision Tag */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${decisionBadgeClass}`}>
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>AI Decision: {decisionText}</span>
          </div>

          {/* Export Suite Buttons */}
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Export JSON
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* DOCUMENT HEADER */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-primary-500" />
            <span>Pathology Report Analysis</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-850 mt-1">{document.filename}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Laboratory Parameters Extracted: <span className="font-extrabold text-slate-800">{tests.length} tests</span> across all document pages.
          </p>
        </div>

        <div className="flex gap-3 text-xs font-bold text-slate-650">
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-lg font-extrabold text-emerald-600">{normalTests.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Normal</p>
          </div>
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-lg font-extrabold text-red-500">{highTests.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">High</p>
          </div>
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <p className="text-lg font-extrabold text-blue-600">{lowTests.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Low</p>
          </div>
        </div>
      </div>

      {/* DASHBOARD CHARTS & HEALTH SCORE */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 self-start">Calculated Health Index</h3>
          <p className="text-[10px] text-slate-400 self-start mt-0.5">Based on overall abnormal parameters</p>
          
          <div className="w-44 h-44 mt-4 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Score', value: calculatedScore, color: calculatedScore > 75 ? '#10b981' : calculatedScore > 50 ? '#f59e0b' : '#ef4444' },
                    { name: 'Remaining', value: 100 - calculatedScore, color: '#f1f5f9' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={72}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={calculatedScore > 75 ? '#10b981' : calculatedScore > 50 ? '#f59e0b' : '#ef4444'} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-800">{calculatedScore}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Health Score</span>
            </div>
          </div>
        </div>

        {/* Evaluation Status Distribution Pie Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary-500" />
            Parameter Status Breakdown
          </h3>
          <div className="w-full h-44 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[10px] font-bold text-slate-600 border-t pt-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Normal ({normalTests.length})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> High ({highTests.length})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Low ({lowTests.length})</span>
          </div>
        </div>

        {/* Out of Bounds Parameters Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-500" />
            Out-of-Bounds Parameters
          </h3>
          <div className="w-full h-44 mt-2">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="Value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                All extracted parameters are within normal limits!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXECUTIVE AI HEALTH SUMMARY CARD */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-50 text-primary-650 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-850">Comprehensive AI Health Summary</h3>
              <p className="text-xs text-slate-400">Synthesized clinical insights across all document pages</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-650 leading-relaxed font-normal">
          {summary.overall_health || summary.overall_health_summary || "Multi-page pathology analysis completed."}
        </p>

        {/* GUIDANCE GRID CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Precautions / What to Do */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Precautions & Actions</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-650">
              {(summary.precautions?.length > 0 ? summary.precautions : summary.lifestyle_recommendations || [
                "Schedule a routine review of this lab report with your healthcare practitioner."
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What to Eat / Dietary Advice */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span>🥗 What to Eat (Dietary Advice)</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-650">
              {(summary.what_to_eat?.length > 0 ? summary.what_to_eat : summary.diet_recommendations || [
                "Incorporate fresh leafy greens, soluble fiber, fruits, and clean protein sources."
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What to Stop / Avoid */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-red-800">
              <Ban className="w-4 h-4 text-red-600" />
              <span>🚫 What to Stop / Avoid</span>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-650">
              {(summary.what_to_stop?.length > 0 ? summary.what_to_stop : summary.avoid_recommendations || [
                "Eliminate refined sugars, trans fats, deep-fried snacks, and excessive sodium."
              ]).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER & CATEGORY EXPLORER */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search test name, category, value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Show All ({tests.length})
            </button>
            <button 
              onClick={() => setStatusFilter('Normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'Normal' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              🟢 Normal ({normalTests.length})
            </button>
            <button 
              onClick={() => setStatusFilter('High')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'High' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
            >
              🔴 High ({highTests.length})
            </button>
            <button 
              onClick={() => setStatusFilter('Low')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'Low' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              🔵 Low ({lowTests.length})
            </button>
            <button 
              onClick={() => setStatusFilter('ABNORMAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${statusFilter === 'ABNORMAL' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
            >
              ⚠️ All Out-of-Bounds ({abnormalCount})
            </button>
          </div>
        </div>

        {/* CATEGORY ACCORDIONS & DETAILED PARAMETER TABLES */}
        <div className="space-y-4">
          {categories.map((catName) => {
            const catTests = filteredTests.filter(t => (t.category || 'General Pathology') === catName);
            if (catTests.length === 0) return null;

            const isExpanded = openCategories[catName] !== false;

            return (
              <div key={catName} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Category Header */}
                <div 
                  onClick={() => toggleCategory(catName)}
                  className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <h3 className="font-extrabold text-sm text-slate-800">{catName}</h3>
                    <span className="bg-slate-200/70 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {catTests.length} parameter{catTests.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <button className="text-slate-400 hover:text-slate-700 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Table Content */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3">Test Parameter</th>
                          <th className="px-6 py-3">Observed Value</th>
                          <th className="px-6 py-3">Reference Range</th>
                          <th className="px-6 py-3">Evaluation Status</th>
                          <th className="px-6 py-3">Clinical Guidance & Interpretation</th>
                          <th className="px-6 py-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {catTests.map((test, idx) => {
                          let badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                          let labelText = '🟢 Correct (Normal)';

                          if (test.status === 'Low') {
                            badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                            labelText = '🔵 Low (Out of Range)';
                          } else if (test.status === 'High') {
                            badgeClass = 'bg-red-50 text-red-700 border border-red-200';
                            labelText = '🔴 High (Out of Range)';
                          } else if (test.status === 'Attention' || test.status === 'Critical') {
                            badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
                            labelText = '🟡 Attention Needed';
                          }

                          return (
                            <tr key={test.id || `${catName}-${idx}`} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-800">{test.test_name}</td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                {test.result_val} <span className="text-[10px] text-slate-400 font-normal">{test.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-mono">{test.normal_range || 'Reference Standard'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}>
                                  {labelText}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 max-w-xs leading-relaxed">
                                {test.interpretation || test.explanation || 'Normal test baseline.'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => setSelectedTestModal(test)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                                  title="View Test Details & Recommendation"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PARAMETER DETAIL MODAL */}
      {selectedTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedTestModal.category || 'General Pathology'}</span>
                <h3 className="text-base font-extrabold text-slate-800">{selectedTestModal.test_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedTestModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Observed Result</p>
                <p className="font-mono font-extrabold text-sm text-slate-800 mt-0.5">
                  {selectedTestModal.result_val} {selectedTestModal.unit}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Reference Range</p>
                <p className="font-mono font-semibold text-slate-700 mt-0.5">
                  {selectedTestModal.normal_range || 'Reference Standard'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-500" />
                  Medical Interpretation
                </h4>
                <p className="mt-1 text-slate-600 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">
                  {selectedTestModal.interpretation || selectedTestModal.explanation || 'Measured parameter within physiological limits.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  Targeted Recommendation
                </h4>
                <p className="mt-1 text-slate-600 leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60">
                  {selectedTestModal.recommendation || 'Maintain balanced nutrition, adequate hydration, and schedule annual health checkups.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedTestModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
