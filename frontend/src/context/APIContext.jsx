import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const APIContext = createContext(null);

export const useAPI = () => useContext(APIContext);

// --- Client-Side Mocks ---
const MOCK_MEDICAL_RESPONSE = {
  summary: {
    overall_health: "The patient shows a generally stable health profile, but exhibits significant deficiencies in essential nutrients and mild anemia indicators. Most metabolic parameters are normal.",
    key_findings: [
      "Hemoglobin levels are slightly below the healthy reference range.",
      "Vitamin D level is severely deficient.",
      "Total Cholesterol is slightly elevated above the optimal threshold."
    ],
    abnormal_parameters: ["Hemoglobin", "Vitamin D", "Total Cholesterol"],
    recommendations: [
      "Consider Vitamin D supplementation after consulting a physician.",
      "Increase intake of iron-rich foods (e.g., spinach, red meat, lentils).",
      "Incorporate light aerobic exercise and monitor dietary fat intake."
    ],
    attention_tests: ["Vitamin D (Severely Low)"]
  },
  tests: [
    {
      test_name: "Hemoglobin",
      result_val: "10.5",
      unit: "g/dL",
      normal_range: "12.0 - 16.0",
      status: "Low",
      explanation: "Slightly low hemoglobin indicates mild anemia. It can cause mild fatigue and is addressable by adjusting dietary iron."
    },
    {
      test_name: "Vitamin D",
      result_val: "15.0",
      unit: "ng/mL",
      normal_range: "30.0 - 100.0",
      status: "Low",
      explanation: "Severe Vitamin D deficiency can impact bone density and immune function. Daily sun exposure or supplementation is usually advised."
    },
    {
      test_name: "Total Cholesterol",
      result_val: "235.0",
      unit: "mg/dL",
      normal_range: "< 200.0",
      status: "High",
      explanation: "Elevated cholesterol levels can increase cardiovascular risk over time. Minimizing saturated fats and increasing soluble fiber can help."
    },
    {
      test_name: "Thyroid Stimulating Hormone (TSH)",
      result_val: "2.4",
      unit: "uIU/mL",
      normal_range: "0.4 - 4.5",
      status: "Normal",
      explanation: "TSH levels are within the optimal range, suggesting that thyroid function is currently well-balanced."
    },
    {
      test_name: "Blood Glucose (Fasting)",
      result_val: "92.0",
      unit: "mg/dL",
      normal_range: "70.0 - 100.0",
      status: "Normal",
      explanation: "Fasting blood sugar is normal, indicating healthy insulin management and glucose regulation."
    }
  ]
};

const MOCK_LEGAL_RESPONSE = {
  summary: {
    document_type: "Employment Agreement",
    purpose: "Establishes an employment contract between the Employer and the Employee, outlining roles, compensation, and workplace regulations.",
    key_dates: [
      "Start Date: August 1, 2026",
      "Notice Period: 60 days written notification before resignation"
    ],
    responsibilities: [
      "Perform duties associated with the Software Engineer role.",
      "Maintain strict confidentiality of proprietary company materials."
    ],
    payment_terms: "Base salary of $90,000 USD per annum, payable in semi-monthly installments, plus eligibility for performance bonuses.",
    termination_conditions: "Can be terminated by either party with a 60-day written notice, or immediately by the employer 'For Cause' without notice."
  },
  clauses: [
    {
      clause_title: "Notice Period",
      original_text: "The employee shall provide a written notice period of sixty days prior to voluntary resignation.",
      explanation: "If you decide to quit, you must let the company know in writing at least 60 days before your final day.",
      risk_level: "Medium",
      risk_explanation: "A 60-day notice is longer than the typical 2-week standard. This may delay your start date at a new job."
    },
    {
      clause_title: "Non-Compete Covenant",
      original_text: "For a period of 12 months following termination, the employee shall not engage in any activity competitive with the employer within a 50-mile radius.",
      explanation: "For one year after leaving this job, you cannot work for a competitor or start a competing business within 50 miles of your office.",
      risk_level: "High",
      risk_explanation: "This restricts your career mobility. Non-competes can prevent you from finding local employment in your field."
    },
    {
      clause_title: "Intellectual Property Ownership",
      original_text: "All inventions, software code, and processes created by the employee during working hours belong exclusively to the company.",
      explanation: "Any work, code, or ideas you create while working for this company belong to them, not you.",
      risk_level: "Low",
      risk_explanation: "This is a standard industry practice. Just make sure not to work on personal side projects during company time."
    },
    {
      clause_title: "Governing Jurisdiction",
      original_text: "This agreement shall be interpreted in accordance with the laws of the State of Delaware, and any disputes shall be arbitrated therein.",
      explanation: "If there is a lawsuit or dispute, it will be handled in Delaware under Delaware laws, regardless of where you live.",
      risk_level: "Medium",
      risk_explanation: "If you reside elsewhere, traveling to Delaware for legal proceedings or arbitration could be costly and inconvenient."
    }
  ]
};

const getDynamicMockMedical = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('blood') || name.includes('cbc') || name.includes('complete')) {
    return {
      summary: {
        overall_health: "The patient's Complete Blood Count (CBC) is mostly normal, showing healthy platelet and white blood cell levels, but indicates mild iron-deficiency anemia due to low hemoglobin.",
        key_findings: [
          "Hemoglobin levels are below the standard threshold (10.5 g/dL).",
          "Red Blood Cell count is slightly low.",
          "White Blood Cell and Platelet counts are in the healthy reference range."
        ],
        abnormal_parameters: ["Hemoglobin", "Red Blood Cells (RBC)"],
        recommendations: [
          "Increase dietary intake of iron-rich foods (e.g., spinach, red meat, lentils).",
          "Consult with a healthcare provider regarding iron supplementation.",
          "Recheck CBC levels in 3 months to monitor progress."
        ],
        attention_tests: ["Hemoglobin (Mild Anemia indicator)"]
      },
      tests: [
        {
          test_name: "Hemoglobin",
          result_val: "10.5",
          unit: "g/dL",
          normal_range: "12.0 - 16.0",
          status: "Low",
          explanation: "Low hemoglobin reduces oxygen delivery to tissues, potentially causing fatigue or weakness."
        },
        {
          test_name: "Red Blood Cells (RBC)",
          result_val: "3.8",
          unit: "M/uL",
          normal_range: "4.0 - 5.2",
          status: "Low",
          explanation: "A low RBC count matches the low hemoglobin and points toward mild anemia."
        },
        {
          test_name: "White Blood Cells (WBC)",
          result_val: "6.2",
          unit: "K/uL",
          normal_range: "4.5 - 11.0",
          status: "Normal",
          explanation: "Normal WBC counts indicate that the immune system is currently stable with no active infection."
        },
        {
          test_name: "Platelets",
          result_val: "250.0",
          unit: "K/uL",
          normal_range: "150.0 - 450.0",
          status: "Normal",
          explanation: "Platelet levels are healthy, indicating normal blood clotting capability."
        }
      ]
    };
  }

  if (name.includes('vitamin') || name.includes('vit') || name.includes('deficiency')) {
    return {
      summary: {
        overall_health: "The patient is suffering from severe Vitamin D deficiency, which can affect bone strength, mood, and immunity. Calcium levels remain normal.",
        key_findings: [
          "Vitamin D level is critically low at 12.0 ng/mL.",
          "Serum Calcium and Phosphate levels are within the normal reference ranges."
        ],
        abnormal_parameters: ["Vitamin D (25-Hydroxy)"],
        recommendations: [
          "Initiate clinical-strength Vitamin D3 supplementation under medical supervision.",
          "Incorporate calcium-rich foods and spend 15 minutes in midday sunlight daily.",
          "Schedule a follow-up test in 8-12 weeks."
        ],
        attention_tests: ["Vitamin D (Severe Deficiency)"]
      },
      tests: [
        {
          test_name: "Vitamin D (25-Hydroxy)",
          result_val: "12.0",
          unit: "ng/mL",
          normal_range: "30.0 - 100.0",
          status: "Low",
          explanation: "Severely low vitamin D levels can cause bone pain, muscle weakness, and affect calcium absorption."
        },
        {
          test_name: "Serum Calcium",
          result_val: "9.6",
          unit: "mg/dL",
          normal_range: "8.5 - 10.2",
          status: "Normal",
          explanation: "Normal calcium indicates that the body is maintaining calcium balance despite the vitamin D deficiency."
        }
      ]
    };
  }

  return MOCK_MEDICAL_RESPONSE;
};

const getDynamicMockLegal = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('doctor') || name.includes('physician') || name.includes('female') || name.includes('medical')) {
    return {
      summary: {
        document_type: "Physician Employment Agreement",
        purpose: "Establishes a clinical services employment contract between the Healthcare Group and the Doctor, outlining clinical duties, malpractice insurance, and compensation.",
        key_dates: [
          "Start Date: October 1, 2026",
          "Termination Notice: 90 days written notice by either party"
        ],
        responsibilities: [
          "Provide patient care and clinical services in accordance with medical standards.",
          "Maintain active license to practice medicine and board certifications."
        ],
        payment_terms: "Base salary of $210,000 USD per annum, plus productivity bonuses based on RVU targets.",
        termination_conditions: "90 days written notification required, or immediate termination by employer for loss of medical license/privileges."
      },
      clauses: [
        {
          clause_title: "Termination Notice",
          original_text: "Either party may terminate this agreement without cause upon ninety (90) days prior written notice to the other party.",
          explanation: "You or the employer must give 90 days notice in writing to end the contract without a specific reason.",
          risk_level: "Medium",
          risk_explanation: "90 days is a long transition period. It may limit your ability to start a new practice quickly."
        },
        {
          clause_title: "Restrictive Covenant (Non-Compete)",
          original_text: "During employment and for 2 years post-termination, Physician shall not practice medicine within a 15-mile radius of any clinic operated by the Employer.",
          explanation: "For two years after leaving, you cannot practice medicine or open a clinic within 15 miles of any of the employer's offices.",
          risk_level: "High",
          risk_explanation: "Highly restrictive. Since the employer operates multiple clinics, this could force you to relocate to practice medicine."
        },
        {
          clause_title: "Malpractice Insurance & Tail Coverage",
          original_text: "Employer shall provide claims-made professional liability insurance. Upon termination, Physician shall be responsible for purchasing tail coverage.",
          explanation: "The employer pays for your malpractice insurance while you work there, but when you leave, you have to pay for the 'tail' coverage yourself.",
          risk_level: "High",
          risk_explanation: "Tail coverage for medical malpractice can be extremely expensive (often tens of thousands of dollars)."
        }
      ]
    };
  }

  if (name.includes('lease') || name.includes('rent') || name.includes('apartment') || name.includes('tenant')) {
    return {
      summary: {
        document_type: "Residential Lease Agreement",
        purpose: "Outlines the terms under which a Landlord rents a residential property to a Tenant, specifying rent, duration, and property rules.",
        key_dates: [
          "Lease Term: 12 months, starting September 1, 2026",
          "Rent Due: On or before the 1st of each calendar month"
        ],
        responsibilities: [
          "Pay monthly rent on time and maintain the premises in clean condition.",
          "Obtain prior written approval from the landlord before making alterations."
        ],
        payment_terms: "Monthly rent of $1,850 USD. Late fee of $100 applies after the 5th of the month. Security deposit of $1,850.",
        termination_conditions: "Tenant may not terminate early without forfeiting the security deposit and paying a 2-month rent penalty."
      },
      clauses: [
        {
          clause_title: "Late Fee Penalty",
          original_text: "Rent is due on the 1st. A late charge of $100 shall be assessed if rent is not received by 5:00 PM on the 5th of the month.",
          explanation: "If you pay rent after the 5th day of the month, you will be charged an extra $100.",
          risk_level: "Low",
          risk_explanation: "Standard grace period and late fee amount in most residential leases."
        },
        {
          clause_title: "Early Termination Penalty",
          original_text: "In the event of early termination by Tenant, Tenant shall forfeit the security deposit and pay an amount equal to two months' rent.",
          explanation: "If you break the lease early, you lose your deposit and must pay an extra 2 months of rent as a penalty.",
          risk_level: "High",
          risk_explanation: "Very costly. If you have to move for a job or emergency, this penalty is extremely punitive."
        },
        {
          clause_title: "Right of Entry",
          original_text: "Landlord reserves the right to enter the premises at any time for emergency repairs, and with a 24-hour notice for routine inspections.",
          explanation: "The landlord can enter your home anytime for emergencies, and needs to give you 24 hours notice for normal visits.",
          risk_level: "Medium",
          risk_explanation: "Standard but can feel intrusive if the landlord conducts frequent 'routine' inspections."
        }
      ]
    };
  }

  return MOCK_LEGAL_RESPONSE;
};

// Seeding initial local database
const getInitialDocuments = () => {
  const stored = localStorage.getItem('medlaw_demo_documents');
  if (stored) return JSON.parse(stored);

  // Seed default data so the dashboard isn't empty on first visit
  const seed = [
    {
      id: 101,
      filename: "CBC_and_Vitamin_D_Report.pdf",
      file_type: "medical",
      uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      text_content: "CBC and Vitamin D Laboratory Test Report. Patient: Demo User. Hemoglobin: 10.5 g/dL (Low), Vitamin D: 15.0 ng/mL (Low), Cholesterol: 235.0 mg/dL (High).",
      summary_json: JSON.stringify(MOCK_MEDICAL_RESPONSE.summary),
      medical_tests: MOCK_MEDICAL_RESPONSE.tests
    },
    {
      id: 102,
      filename: "Software_Engineer_Contract.pdf",
      file_type: "legal",
      uploaded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      text_content: "Employment Agreement. Software Engineer Role. Notice period is sixty days. Non-compete for 12 months in 50-mile radius. Governing jurisdiction: Delaware. Salary: $90,000 USD.",
      summary_json: JSON.stringify(MOCK_LEGAL_RESPONSE.summary),
      legal_clauses: MOCK_LEGAL_RESPONSE.clauses
    }
  ];
  localStorage.setItem('medlaw_demo_documents', JSON.stringify(seed));
  return seed;
};

// Client-Side Gemini Call Helpers
const cleanJsonString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
  return cleaned.trim();
};

const callGeminiDirect = async (prompt, systemInstruction, geminiKey, fileBase64 = null, mimeType = null) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const parts = [];
  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: fileBase64
      }
    });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const resJson = await response.json();
  const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return JSON.parse(cleanJsonString(text));
};

const callGeminiChatDirect = async (prompt, systemInstruction, geminiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error('Gemini API request failed');
  const resJson = await response.json();
  return resJson.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (err) => reject(err);
  });
};

const parseFloatSafe = (val) => {
  if (!val) return null;
  try {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } catch (e) {
    return null;
  }
};

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

  const isDemo = () => localStorage.getItem('medlaw_demo_mode') === 'true';

  // Upload document
  const uploadDocument = async (file, fileType) => {
    if (isDemo()) {
      let analysisResult;
      let textContent = "";

      if (geminiKey) {
        try {
          const base64 = await fileToBase64(file);
          const mimeType = file.type || "application/pdf";
          
          if (fileType === 'medical') {
            const systemPrompt = `You are an expert Medical Report Analyzer. Your task is to extract information from the medical report provided and output a structured JSON report.
You must return a JSON object with the following schema:
{
  "summary": {
    "overall_health": "Short paragraph summarizing the overall health status of the patient.",
    "key_findings": ["Bullet point 1", "Bullet point 2"],
    "abnormal_parameters": ["List of parameters that are out of bounds"],
    "recommendations": ["Recommendation 1", "Recommendation 2"],
    "attention_tests": ["Tests that require immediate doctor visit or attention"]
  },
  "tests": [
    {
      "test_name": "Name of the medical test (e.g. Hemoglobin, Vitamin D)",
      "result_val": "Numeric result value with decimal (e.g. 10.5, 32.1) or qualitative (e.g. Positive)",
      "unit": "Unit of measurement (e.g. g/dL, ng/mL) or null",
      "normal_range": "Normal range description (e.g. 12-16, >30) or null",
      "status": "Normal" or "Low" or "High" or "Attention",
      "explanation": "Simple 1-2 sentence explanation of what this test result means, possible lifestyle adjustments, and when to seek advice. Never declare a diagnosis."
    }
  ]
}`;
            analysisResult = await callGeminiDirect("Analyze this medical report.", systemPrompt, geminiKey, base64, mimeType);
            textContent = `Medical analysis of ${file.name}. Overall Health: ${analysisResult.summary?.overall_health}`;
          } else {
            const systemPrompt = `You are an expert Legal Document Analyzer. Your task is to extract information from the legal agreement and provide a structured JSON report.
You must return a JSON object with the following schema:
{
  "summary": {
    "document_type": "E.g. Lease Agreement, NDA, Employment Contract",
    "purpose": "1-2 sentences explaining the main objective of this document.",
    "key_dates": ["List of important dates like start date, expiration date, notice milestones"],
    "responsibilities": ["Responsibility 1", "Responsibility 2"],
    "payment_terms": "Description of any financial obligations, salary, or security deposit details, or 'N/A'",
    "termination_conditions": "Details about how either party can end the agreement."
  },
  "clauses": [
    {
      "clause_title": "Name of the clause (e.g. Notice Period, Non-Compete, Indemnification)",
      "original_text": "Exact text quote or summary of the clause from the document.",
      "explanation": "Simple plain-English translation explaining what this means to an average person.",
      "risk_level": "Low" or "Medium" or "High",
      "risk_explanation": "Why this clause is marked with this risk level and what the user should watch out for."
    }
  ]
}`;
            analysisResult = await callGeminiDirect("Analyze this legal agreement.", systemPrompt, geminiKey, base64, mimeType);
            textContent = `Legal analysis of ${file.name}. Document Type: ${analysisResult.summary?.document_type}`;
          }
        } catch (e) {
          console.error("Client Gemini analysis failed. Falling back to Mock.", e);
          analysisResult = fileType === 'medical' ? getDynamicMockMedical(file.name) : getDynamicMockLegal(file.name);
          textContent = `Mocked Local Report. File name: ${file.name}`;
        }
      } else {
        analysisResult = fileType === 'medical' ? getDynamicMockMedical(file.name) : getDynamicMockLegal(file.name);
        textContent = `Mocked Local Report. File name: ${file.name}`;
      }

      const docs = getInitialDocuments();
      const newDoc = {
        id: Date.now(),
        filename: file.name,
        file_type: fileType,
        uploaded_at: new Date().toISOString(),
        text_content: textContent,
        summary_json: JSON.stringify(analysisResult.summary),
        medical_tests: fileType === 'medical' ? analysisResult.tests : [],
        legal_clauses: fileType === 'legal' ? analysisResult.clauses : []
      };
      
      docs.unshift(newDoc);
      localStorage.setItem('medlaw_demo_documents', JSON.stringify(docs));
      return newDoc;
    }

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
    if (isDemo()) {
      let docs = getInitialDocuments();
      if (fileType) {
        docs = docs.filter(d => d.file_type === fileType);
      }
      if (search) {
        const s = search.toLowerCase();
        docs = docs.filter(d => d.filename.toLowerCase().includes(s));
      }
      return docs;
    }

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
    if (isDemo()) {
      const docs = getInitialDocuments();
      const doc = docs.find(d => d.id === parseInt(id));
      if (!doc) throw new Error("Document not found");
      return doc;
    }

    const client = getClient();
    const response = await client.get(`/documents/${id}`);
    return response.data;
  };

  // Delete document
  const deleteDocument = async (id) => {
    if (isDemo()) {
      let docs = getInitialDocuments();
      docs = docs.filter(d => d.id !== parseInt(id));
      localStorage.setItem('medlaw_demo_documents', JSON.stringify(docs));
      return { message: "Document deleted successfully" };
    }

    const client = getClient();
    const response = await client.delete(`/documents/${id}`);
    return response.data;
  };

  // Compare two reports
  const compareReports = async (id1, id2) => {
    if (isDemo()) {
      const doc1 = await getDocument(id1);
      const doc2 = await getDocument(id2);
      
      let d1 = doc1;
      let d2 = doc2;
      if (new Date(d1.uploaded_at) > new Date(d2.uploaded_at)) {
        d1 = doc2;
        d2 = doc1;
      }

      const tests1List = d1.medical_tests || [];
      const tests2List = d2.medical_tests || [];

      const tests1 = {};
      tests1List.forEach(t => {
        if (t && t.test_name) tests1[t.test_name.toLowerCase().trim()] = t;
      });

      const tests2 = {};
      tests2List.forEach(t => {
        if (t && t.test_name) tests2[t.test_name.toLowerCase().trim()] = t;
      });

      const improvements = [];
      const worsenings = [];
      const stables = [];

      const allNames = new Set([...Object.keys(tests1), ...Object.keys(tests2)]);

      allNames.forEach(name => {
        const t1 = tests1[name];
        const t2 = tests2[name];

        if (!t1 || !t2) return;

        const val1_num = parseFloatSafe(t1.result_val);
        const val2_num = parseFloatSafe(t2.result_val);
        const unit = t2.unit || t1.unit || '';

        const status1 = t1.status || 'Normal';
        const status2 = t2.status || 'Normal';

        let change_type = 'stable';
        let explanation = '';

        if (status1 === 'Normal' && status2 === 'Normal') {
          change_type = 'stable';
          explanation = `Value remains stable within normal boundaries (from ${t1.result_val} to ${t2.result_val} ${unit}).`;
        } else if ((status1 === 'Low' || status1 === 'High') && status2 === 'Normal') {
          change_type = 'improved';
          explanation = `Extremely positive trend. Test value returned to normal range (was ${t1.result_val} ${status1}, now ${t2.result_val}).`;
        } else if (status1 === 'Normal' && (status2 === 'Low' || status2 === 'High')) {
          change_type = 'worsened';
          explanation = `Needs attention. Test value fell out of the normal range (was ${t1.result_val}, now ${t2.result_val} ${status2}).`;
        } else if ((status1 === 'Low' || status1 === 'High') && (status2 === 'Low' || status2 === 'High')) {
          if (val1_num !== null && val2_num !== null) {
            if (status1 === 'Low' && status2 === 'Low') {
              if (val2_num > val1_num) {
                change_type = 'improved';
                explanation = `Improving trend. Deficient value increased closer to normal range (from ${t1.result_val} to ${t2.result_val} ${unit}).`;
              } else if (val2_num < val1_num) {
                change_type = 'worsened';
                explanation = `Declining trend. Deficient value decreased further (from ${t1.result_val} to ${t2.result_val} ${unit}).`;
              } else {
                change_type = 'stable';
                explanation = `Remains stable but deficient at ${t2.result_val} ${unit}.`;
              }
            } else if (status1 === 'High' && status2 === 'High') {
              if (val2_num < val1_num) {
                change_type = 'improved';
                explanation = `Improving trend. Elevated value decreased closer to normal range (from ${t1.result_val} to ${t2.result_val} ${unit}).`;
              } else if (val2_num > val1_num) {
                change_type = 'worsened';
                explanation = `Declining trend. Elevated value increased further (from ${t1.result_val} to ${t2.result_val} ${unit}).`;
              } else {
                change_type = 'stable';
                explanation = `Remains stable but elevated at ${t2.result_val} ${unit}.`;
              }
            }
          } else {
            if (status1 === status2) {
              change_type = 'stable';
              explanation = `Status remains unchanged (${status2}) at ${t2.result_val} ${unit}.`;
            } else {
              change_type = 'unknown';
              explanation = `Status shifted from ${status1} (${t1.result_val}) to ${status2} (${t2.result_val}).`;
            }
          }
        }

        const item = {
          test_name: t2.test_name,
          report1_val: t1.result_val,
          report2_val: t2.result_val,
          unit: unit,
          status1: status1,
          status2: status2,
          change_type: change_type,
          explanation: explanation
        };

        if (change_type === 'improved') improvements.push(item);
        else if (change_type === 'worsened') worsenings.push(item);
        else stables.push(item);
      });

      return {
        report1_filename: d1.filename,
        report2_filename: d2.filename,
        report1_date: d1.uploaded_at,
        report2_date: d2.uploaded_at,
        improvements,
        worsenings,
        stables
      };
    }

    const client = getClient();
    const response = await client.get(`/documents/compare/${id1}/${id2}`);
    return response.data;
  };

  // Create new chat session
  const createChatSession = async (documentId) => {
    if (isDemo()) {
      const doc = await getDocument(documentId);
      const sessions = JSON.parse(localStorage.getItem('medlaw_demo_chat_sessions') || '[]');
      const newSession = {
        id: Date.now(),
        document_id: parseInt(documentId),
        title: `Chat on ${doc.filename} (${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
        created_at: new Date().toISOString(),
        messages: []
      };
      sessions.push(newSession);
      localStorage.setItem('medlaw_demo_chat_sessions', JSON.stringify(sessions));
      return newSession;
    }

    const client = getClient();
    const response = await client.post(`/chat/session?document_id=${documentId}`);
    return response.data;
  };

  // Get chat sessions for a document
  const getChatSessions = async (documentId) => {
    if (isDemo()) {
      const sessions = JSON.parse(localStorage.getItem('medlaw_demo_chat_sessions') || '[]');
      return sessions.filter(s => s.document_id === parseInt(documentId));
    }

    const client = getClient();
    const response = await client.get(`/chat/sessions/${documentId}`);
    return response.data;
  };

  // Get chat session details (messages)
  const getChatSession = async (sessionId) => {
    if (isDemo()) {
      const sessions = JSON.parse(localStorage.getItem('medlaw_demo_chat_sessions') || '[]');
      const session = sessions.find(s => s.id === parseInt(sessionId));
      if (!session) throw new Error("Session not found");
      return session;
    }

    const client = getClient();
    const response = await client.get(`/chat/session/${sessionId}`);
    return response.data;
  };

  // Send message in RAG chat
  const sendChatMessage = async (sessionId, messageText) => {
    if (isDemo()) {
      const sessions = JSON.parse(localStorage.getItem('medlaw_demo_chat_sessions') || '[]');
      const sessionIdx = sessions.findIndex(s => s.id === parseInt(sessionId));
      if (sessionIdx === -1) throw new Error("Session not found");
      const session = sessions[sessionIdx];
      const doc = await getDocument(session.document_id);

      // Append user message
      const userMsg = {
        id: Date.now(),
        sender: 'user',
        message_text: messageText,
        created_at: new Date().toISOString()
      };
      if (!session.messages) session.messages = [];
      session.messages.push(userMsg);

      let aiAnswer = "";

      if (geminiKey) {
        try {
          const docContext = doc.text_content || "";
          const systemPrompt = `You are a highly capable AI assistant helping a user understand their uploaded document.
The document type is: ${doc.file_type}
The document content context is:
---
${docContext}
---

Rules:
1. Answer the user's questions truthfully and accurately based ONLY on the provided context from the document.
2. If the answer cannot be found in the document context, state: "I couldn't find that information in the uploaded document." Do not make up facts.
3. If this is a Medical Document:
   - NEVER diagnose diseases or prescribe treatments.
   - Show disclaimer: "This information is educational only and not a medical diagnosis."
4. If this is a Legal Document:
   - NEVER provide formal legal advice.
   - Explain terms clearly and advise consulting a lawyer for actual legal choices.
5. Keep your tone professional, empathetic, and objective.`;

          // Format context history
          const historyLines = session.messages.slice(-6, -1).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.message_text}`).join("\n");
          const prompt = `Conversation history:\n${historyLines}\n\nUser Question: ${messageText}\nAI Answer:`;
          
          aiAnswer = await callGeminiChatDirect(prompt, systemPrompt, geminiKey);
        } catch (e) {
          console.error("Client Gemini Chat failed. Falling back to Mock.", e);
          aiAnswer = "I ran into a connection issue with Gemini. Here's a mock response: " + getMockChatResponse(messageText, doc.file_type);
        }
      } else {
        aiAnswer = getMockChatResponse(messageText, doc.file_type);
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        message_text: aiAnswer,
        created_at: new Date().toISOString()
      };
      session.messages.push(aiMsg);

      sessions[sessionIdx] = session;
      localStorage.setItem('medlaw_demo_chat_sessions', JSON.stringify(sessions));
      return aiMsg;
    }

    const client = getClient();
    const response = await client.post(`/chat/session/${sessionId}/message`, {
      message_text: messageText
    });
    return response.data;
  };

  const getMockChatResponse = (query, docType) => {
    const queryLower = query.toLowerCase();
    if (docType === 'medical') {
      if (queryLower.includes('vitamin')) {
        return "Based on your report, your Vitamin D is 15.0 ng/mL, which is below the normal range of 30.0 - 100.0 ng/mL. This is considered a deficiency. You should consult a doctor to see if supplements are needed. *Disclaimer: This information is educational only and not a medical diagnosis.*";
      }
      if (queryLower.includes('hemoglobin') || queryLower.includes('anemia')) {
        return "Your hemoglobin is 10.5 g/dL, which is slightly lower than the normal range of 12.0 - 16.0 g/dL. This is flagged as 'Low'. It may indicate mild anemia, which can cause fatigue. A doctor can recommend dietary changes or iron supplements. *Disclaimer: This information is educational only and not a medical diagnosis.*";
      }
      if (queryLower.includes('cholesterol')) {
        return "Your total cholesterol is 235.0 mg/dL, which is elevated (normal range is < 200.0 mg/dL). It's recommended to reduce saturated fats in your diet, incorporate physical activity, and monitor. *Disclaimer: This information is educational only and not a medical diagnosis.*";
      }
      return "I see you're asking about your medical report while in Demo Mode. To get real AI-powered answers analyzed from your actual uploaded document, please add your Google Gemini API Key by clicking 'AI API Settings' in the bottom-left sidebar. *(Disclaimer: This is a demo fallback)*";
    } else {
      if (queryLower.includes('non-compete') || queryLower.includes('compete')) {
        return "According to the contract, there is a Non-Compete Covenant. It lasts for 12 months after your employment ends and prevents you from competing within a 50-mile radius of the company's offices. This is a High risk item. Please check with a lawyer to understand its enforceability.";
      }
      if (queryLower.includes('notice') || queryLower.includes('resig') || queryLower.includes('quit')) {
        return "The document states that you need to give a written notice of 60 days before resigning. The employer can terminate the agreement immediately without notice only if it is 'For Cause'.";
      }
      if (queryLower.includes('salary') || queryLower.includes('pay') || queryLower.includes('compensation')) {
        return "The payment terms mention a base salary of $90,000 USD per annum, paid semi-monthly, with eligibility for performance-based bonuses.";
      }
      return "I see you're asking about your contract while in Demo Mode. To get real AI-powered answers analyzed from your actual uploaded document, please add your Google Gemini API Key by clicking 'AI API Settings' in the bottom-left sidebar. *(Disclaimer: This is a demo fallback)*";
    }
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
