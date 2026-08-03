import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker (CDN – no bundler config needed)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const APIContext = createContext(null);

export const useAPI = () => useContext(APIContext);

// --- Client-Side Mocks ---
const MOCK_MEDICAL_RESPONSE = {
  summary: {
    overall_health: "Comprehensive 9-page pathology report analysis. The patient shows optimal glycemic control, normal thyroid function, and healthy renal clearance. Elevated parameters detected in Total Cholesterol (284 mg/dL), LDL (203.7 mg/dL), Triglycerides (192 mg/dL), and CRP (5.86 mg/L). Deficient Vitamin D (22 ng/mL).",
    health_score: 72,
    health_decision: "Attention Required - Follow-Up Suggested",
    key_findings: [
      "Total Cholesterol is elevated at 284 mg/dL (Ref: < 200 mg/dL).",
      "LDL Bad Cholesterol is elevated at 203.7 mg/dL (Ref: < 100 mg/dL).",
      "Vitamin D is insufficient at 22 ng/mL (Ref: 30-100 ng/mL).",
      "CRP Inflammatory Marker is slightly elevated at 5.86 mg/L (Ref: < 5 mg/L)."
    ],
    abnormal_parameters: ["Total Cholesterol", "LDL Cholesterol", "Triglycerides", "Vitamin D", "CRP"],
    precautions: [
      "Schedule a follow-up consultation with your physician regarding lipid profile.",
      "Get 15-20 minutes of daily morning sun exposure for Vitamin D."
    ],
    what_to_eat: [
      "Oats, soluble fiber, walnuts, almonds, and extra virgin olive oil.",
      "Vitamin D3 fortified foods, eggs, and salmon."
    ],
    what_to_stop: [
      "Avoid trans fats, deep-fried foods, and refined sugars."
    ],
    recommendations: [
      "Incorporate daily 30-minute cardiovascular exercise.",
      "Re-evaluate lipid panel and Vitamin D in 8-12 weeks."
    ],
    attention_tests: ["Total Cholesterol (High)", "LDL Cholesterol (High)", "Vitamin D (Low)"]
  },
  tests: [
    // Page 1: Diabetes & Glycemic Index
    { category: "Diabetes / Glycemic Index", test_name: "HbA1c", result_val: "5.00", unit: "%", normal_range: "4.0 - 5.6", status: "Normal", explanation: "Correct (In Normal Range). Optimal non-diabetic long-term glucose level.", interpretation: "HbA1c of 5.0% is within the healthy reference range.", recommendation: "Maintain balanced diet and active lifestyle.", confidence: "high" },
    { category: "Diabetes / Glycemic Index", test_name: "Mean Blood Glucose", result_val: "96.80", unit: "mg/dL", normal_range: "70.0 - 100.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy average blood sugar level.", interpretation: "Estimated average glucose is normal.", recommendation: "Continue regular nutrition.", confidence: "high" },

    // Page 2 & 3: Thyroid & Hormones / Vitamins
    { category: "Thyroid & Hormones", test_name: "T4 (Thyroxine)", result_val: "7.91", unit: "µg/dL", normal_range: "5.0 - 14.10", status: "Normal", explanation: "Correct (In Normal Range). Optimal thyroid hormone T4 output.", interpretation: "T4 level is normal.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "Thyroid & Hormones", test_name: "TSH (Thyroid Stimulating Hormone)", result_val: "3.29", unit: "µIU/mL", normal_range: "0.30 - 5.50", status: "Normal", explanation: "Correct (In Normal Range). Well-balanced pituitary thyroid regulation.", interpretation: "TSH is optimal.", recommendation: "Annual health check.", confidence: "high" },
    { category: "Thyroid & Hormones", test_name: "T3 (Tri-iodothyronine)", result_val: "1.54", unit: "ng/mL", normal_range: "0.7 - 2.04", status: "Normal", explanation: "Correct (In Normal Range). Normal active thyroid hormone level.", interpretation: "T3 is within reference bounds.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "Vitamins & Nutrients", test_name: "Vitamin B12 - Serum", result_val: "559.00", unit: "pg/mL", normal_range: "200 - 835", status: "Normal", explanation: "Correct (In Normal Range). Healthy Vitamin B12 levels for nerve function.", interpretation: "B12 levels support healthy red cell formation.", recommendation: "Maintain B12 rich diet.", confidence: "high" },
    { category: "Vitamins & Nutrients", test_name: "VITAMIN D TOTAL (25-OH) SERUM", result_val: "22.00", unit: "ng/mL", normal_range: "30.0 - 100.0", status: "Low", explanation: "Out of Range (Low). Insufficient Vitamin D (<30 ng/mL). Daily morning sun exposure and D3 supplements recommended under medical supervision.", interpretation: "Vitamin D is deficient (<30 ng/mL).", recommendation: "15-20 mins daily morning sun & D3 supplementation.", confidence: "high" },

    // Page 4 & 5: Complete Blood Count (CBC)
    { category: "CBC / Hematology", test_name: "Haemoglobin", result_val: "14.20", unit: "g/dL", normal_range: "13.0 - 18.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy oxygen-carrying capacity.", interpretation: "Normal hemoglobin.", recommendation: "Balanced nutrition.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Total Leucocyte Count (WBC)", result_val: "4.70", unit: "x 10^3/µL", normal_range: "4.0 - 11.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy white blood cell baseline defense.", interpretation: "WBC is optimal.", recommendation: "Maintain healthy immunity.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Total Erythrocyte Count (RBC)", result_val: "4.59", unit: "x 10^6/µL", normal_range: "3.5 - 5.5", status: "Normal", explanation: "Correct (In Normal Range). Red blood cell count is within normal limits.", interpretation: "RBC is normal.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Platelet Count", result_val: "189.00", unit: "x 10^3/µL", normal_range: "150 - 450", status: "Normal", explanation: "Correct (In Normal Range). Platelet count supports proper blood coagulation.", interpretation: "Platelets are normal.", recommendation: "Routine checkup.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "MPV (Mean Platelet Volume)", result_val: "12.90", unit: "fL", normal_range: "7.8 - 11.0", status: "High", explanation: "Out of Range (High). Elevated mean platelet volume.", interpretation: "MPV is slightly elevated.", recommendation: "Follow-up CBC.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "PCT (Plateletcrit)", result_val: "0.24", unit: "%", normal_range: "0.15 - 0.62", status: "Normal", explanation: "Correct (In Normal Range). Platelet volume percentage is normal.", interpretation: "PCT is normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "PDW (Platelet Distribution Width)", result_val: "30.90", unit: "%", normal_range: "8.3 - 25.0", status: "High", explanation: "Out of Range (High). Increased platelet size variation.", interpretation: "PDW is elevated.", recommendation: "Routine follow-up.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "HCT (Hematocrit / P.C.V.)", result_val: "41.50", unit: "%", normal_range: "40.0 - 52.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy red cell volume percentage.", interpretation: "HCT is normal.", recommendation: "Adequate hydration.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "M.C.V. (Mean Corpuscular Volume)", result_val: "90.30", unit: "fL", normal_range: "82.0 - 95.0", status: "Normal", explanation: "Correct (In Normal Range). Normal average red cell size.", interpretation: "MCV is optimal.", recommendation: "Balanced diet.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "M.C.H.", result_val: "30.90", unit: "pg", normal_range: "25.0 - 33.0", status: "Normal", explanation: "Correct (In Normal Range). Average hemoglobin per red cell is normal.", interpretation: "MCH is normal.", recommendation: "Routine maintenance.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "M.C.H.C.", result_val: "34.20", unit: "gm/dL", normal_range: "33.0 - 37.0", status: "Normal", explanation: "Correct (In Normal Range). Normal hemoglobin concentration.", interpretation: "MCHC is normal.", recommendation: "Routine wellness.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "R.D.W. CV", result_val: "14.50", unit: "%", normal_range: "11.0 - 16.0", status: "Normal", explanation: "Correct (In Normal Range). Normal red cell size variation.", interpretation: "RDW is normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Neutrophils", result_val: "60.30", unit: "%", normal_range: "40.0 - 70.0", status: "Normal", explanation: "Correct (In Normal Range). Normal neutrophil differential percentage.", interpretation: "Neutrophils normal.", recommendation: "Healthy baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Lymphocytes", result_val: "30.50", unit: "%", normal_range: "20.0 - 45.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy immune lymphocyte proportion.", interpretation: "Lymphocytes normal.", recommendation: "Healthy immune baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Eosinophils", result_val: "0.90", unit: "%", normal_range: "0.0 - 6.0", status: "Normal", explanation: "Correct (In Normal Range). Eosinophils within healthy baseline.", interpretation: "Eosinophils normal.", recommendation: "Routine check.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Monocytes", result_val: "8.10", unit: "%", normal_range: "0.0 - 8.0", status: "High", explanation: "Out of Range (Slightly High). Monocyte percentage at upper border.", interpretation: "Monocytes slightly elevated.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Basophils", result_val: "0.20", unit: "%", normal_range: "0.0 - 1.0", status: "Normal", explanation: "Correct (In Normal Range). Normal basophil count.", interpretation: "Basophils normal.", recommendation: "Healthy baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Absolute Neutrophil Count", result_val: "2.79", unit: "x 10^3/µL", normal_range: "1.5 - 8.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy absolute neutrophil count.", interpretation: "ANC normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Absolute Lymphocyte Count", result_val: "1.42", unit: "x 10^3/µL", normal_range: "1.02 - 3.55", status: "Normal", explanation: "Correct (In Normal Range). Healthy absolute lymphocyte count.", interpretation: "ALC normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Absolute Eosinophil Count", result_val: "0.04", unit: "x 10^3/µL", normal_range: "0.04 - 0.44", status: "Normal", explanation: "Correct (In Normal Range). Healthy absolute eosinophil count.", interpretation: "AEC normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Absolute Monocyte Count", result_val: "0.38", unit: "x 10^3/µL", normal_range: "0.26 - 1.07", status: "Normal", explanation: "Correct (In Normal Range). Normal absolute monocyte count.", interpretation: "AMC normal.", recommendation: "Routine baseline.", confidence: "high" },
    { category: "CBC / Hematology", test_name: "Absolute Basophil Count", result_val: "0.01", unit: "x 10^3/µL", normal_range: "0.02 - 0.1", status: "Normal", explanation: "Correct (In Normal Range). Basophil count is normal.", interpretation: "ABC normal.", recommendation: "Routine baseline.", confidence: "high" },

    // Page 7: Kidney & Liver
    { category: "Kidney Function & Renal", test_name: "Urea - Serum", result_val: "23.30", unit: "mg/dL", normal_range: "10.00 - 50.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy blood urea clearance.", interpretation: "Renal urea normal.", recommendation: "Maintain daily fluid intake.", confidence: "high" },
    { category: "Kidney Function & Renal", test_name: "Creatinine - Serum", result_val: "1.09", unit: "mg/dL", normal_range: "0.72 - 1.25", status: "Normal", explanation: "Correct (In Normal Range). Normal kidney filtration performance.", interpretation: "Creatinine normal.", recommendation: "Maintain optimal hydration.", confidence: "high" },
    { category: "Kidney Function & Renal", test_name: "Uric Acid - Serum", result_val: "4.75", unit: "mg/dL", normal_range: "3.5 - 7.2", status: "Normal", explanation: "Correct (In Normal Range). Normal uric acid levels.", interpretation: "Uric acid is normal.", recommendation: "Maintain hydration.", confidence: "high" },
    { category: "Liver Function Panel", test_name: "Alanine Transaminase (SGPT/ALT)", result_val: "30.10", unit: "U/L", normal_range: "0 - 55", status: "Normal", explanation: "Correct (In Normal Range). Healthy liver cellular enzyme levels.", interpretation: "SGPT is optimal.", recommendation: "Healthy lifestyle.", confidence: "high" },
    { category: "Liver Function Panel", test_name: "Aspartate Transaminase (SGOT/AST)", result_val: "28.10", unit: "U/L", normal_range: "0 - 46", status: "Normal", explanation: "Correct (In Normal Range). Normal liver and tissue enzymes.", interpretation: "SGOT is optimal.", recommendation: "Healthy lifestyle.", confidence: "high" },
    { category: "Liver Function Panel", test_name: "Alkaline Phosphatase - Serum", result_val: "57.70", unit: "U/L", normal_range: "< 150.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy bone and liver enzyme levels.", interpretation: "ALP is normal.", recommendation: "Routine monitoring.", confidence: "high" },


    // Page 8: Lipid Profile & Inflammatory Markers
    { category: "Lipid Profile", test_name: "Total Cholesterol - Serum", result_val: "284.00", unit: "mg/dL", normal_range: "< 200.0", status: "High", explanation: "Out of Range (High). Elevated total cholesterol (>240 is high risk).", interpretation: "Total cholesterol is elevated (>240 mg/dL).", recommendation: "Low-saturated-fat diet, soluble fiber, oats, olive oil, and 30-min exercise.", confidence: "high" },
    { category: "Lipid Profile", test_name: "Triglyceride - Serum", result_val: "192.00", unit: "mg/dL", normal_range: "< 150.0", status: "High", explanation: "Out of Range (High). Borderline high triglycerides.", interpretation: "Triglycerides are elevated (192 mg/dL).", recommendation: "Reduce refined carbs, sugars, soda, and sweet pastries.", confidence: "high" },
    { category: "Lipid Profile", test_name: "HDL Cholesterol - Serum", result_val: "41.90", unit: "mg/dL", normal_range: ">= 40.0", status: "Normal", explanation: "Correct (In Normal Range). Good HDL cholesterol above limit.", interpretation: "HDL is protective (>40 mg/dL).", recommendation: "Aerobic exercise to boost HDL.", confidence: "high" },
    { category: "Lipid Profile", test_name: "LDL Cholesterol - Serum", result_val: "203.70", unit: "mg/dL", normal_range: "< 100.0", status: "High", explanation: "Out of Range (High). Very high LDL bad cholesterol.", interpretation: "LDL is very high (>190 mg/dL).", recommendation: "Low-saturated fat diet, omega-3, physician consultation.", confidence: "high" },
    { category: "Lipid Profile", test_name: "VLDL Cholesterol - Serum", result_val: "38.40", unit: "mg/dL", normal_range: "6.0 - 38.0", status: "High", explanation: "Out of Range (Slightly High). Slightly elevated VLDL.", interpretation: "VLDL slightly elevated.", recommendation: "Low carbohydrate diet.", confidence: "high" },
    { category: "Inflammatory Markers", test_name: "CRP (C-Reactive Protein)", result_val: "5.86", unit: "mg/L", normal_range: "0.0 - 5.0", status: "High", explanation: "Out of Range (High). Elevated C-reactive protein.", interpretation: "CRP indicates mild acute inflammation.", recommendation: "Anti-inflammatory diet and doctor follow-up.", confidence: "high" },

    // Page 9: Liver Bilirubin & Total Protein
    { category: "Liver Function Panel", test_name: "Total Bilirubin - Serum", result_val: "0.44", unit: "mg/dL", normal_range: "0.0 - 1.20", status: "Normal", explanation: "Correct (In Normal Range). Normal total bilirubin.", interpretation: "Total bilirubin normal.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "Liver Function Panel", test_name: "Direct Bilirubin - Serum", result_val: "0.11", unit: "mg/dL", normal_range: "0.0 - 0.40", status: "Normal", explanation: "Correct (In Normal Range). Normal conjugated bilirubin.", interpretation: "Direct bilirubin normal.", recommendation: "Routine monitoring.", confidence: "high" },
    { category: "Liver Function Panel", test_name: "Indirect Bilirubin - Serum", result_val: "0.33", unit: "mg/dL", normal_range: "0.0 - 1.00", status: "Normal", explanation: "Correct (In Normal Range). Normal unconjugated bilirubin.", interpretation: "Indirect bilirubin normal.", recommendation: "Routine monitoring.", confidence: "high" },

    { category: "Biochemistry", test_name: "Total Protein - Serum", result_val: "7.52", unit: "g/dL", normal_range: "6.2 - 8.0", status: "Normal", explanation: "Correct (In Normal Range). Healthy total serum protein.", interpretation: "Total protein normal.", recommendation: "Maintain protein intake.", confidence: "high" }
  ]
};


const MOCK_LEGAL_RESPONSE = {
  summary: {
    document_type: "Employment Agreement",
    purpose: "Establishes an employment contract between the Employer and the Employee, outlining roles, compensation, and workplace regulations.",
    joining_date: "August 1, 2026",
    benefits_allowances: "Comprehensive medical and dental insurance, 401(k) matching up to 4%, and $150 monthly wellness/fitness allowance.",
    training_requirements: "Mandatory 2-week internal codebase onboarding. No costs associated.",
    employee_risks: "Intellectual property clause is extremely broad, claiming ownership of any ideas developed during the entire employment term, even off-hours.",
    exploitation_check: "Low risk. The contract has standard terms, competitive salary, and reasonable working hours, though the 60-day notice period is slightly above average.",
    overall_benefits: [
      "Competitive base salary ($90,000) with semi-monthly payouts.",
      "Generous health/wellness allowances and 401(k) matching.",
      "Standard intellectual property protection limited only to working hours."
    ],
    overall_disadvantages: [
      "Restrictive non-compete clause covering 12 months and 50-mile radius.",
      "Extended 60-day notice period for voluntary resignation."
    ],
    key_dates: [
      "Start Date: August 1, 2026",
      "Notice Period: 60 days written notification before resignation"
    ],
    responsibilities: [
      "Perform duties associated with the Software Engineer role.",
      "Maintain strict confidentiality of proprietary company materials."
    ],
    payment_terms: "Base salary of $90,000 USD per annum, payable in semi-monthly installments, plus eligibility for performance bonuses.",
    termination_conditions: "Can be terminated by either party with a 60-day written notice, or immediately by the employer 'For Cause' without notice.",
    contract_parties: {
      primary_party: "Apex Healthcare Group LLC (Employer / First Party)",
      secondary_party: "Dr. Sarah Jenkins, MD (Employee / Physician / Second Party)",
      executed_through: "Corporate HR & Legal Operations Division",
      governing_jurisdiction: "State of Delaware, USA / Mandatory Binding Arbitration"
    },
    detailed_case_brief: "This contract establishes a binding clinical employment relationship between Apex Healthcare Group LLC (First Party) and Dr. Sarah Jenkins, MD (Second Party). Executed through the Corporate HR & Legal Operations Division, the agreement outlines clinical duties, $210,000 base compensation, RVU performance bonuses, 90-day termination notice requirements, 15-mile non-compete obligations, and malpractice tail insurance liabilities under Delaware jurisdiction."
  },
  clauses: [
    {
      clause_title: "Notice Period",
      category: "Termination & Exit",
      location_reference: "Section 7.3",
      original_text: "The employee shall provide a written notice period of sixty days prior to voluntary resignation.",
      explanation: "If you decide to quit, you must let the company know in writing at least 60 days before your final day.",
      employee_advantages: "Gives you a clear 60-day buffer to transition out and wrap up key deliverables.",
      employee_disadvantages: "Prevents you from starting a new role quickly, as many employers expect a 2-4 week notice.",
      risk_level: "Medium",
      detailed_risk_analysis: "An in-depth review of Section 7.3 indicates that while a notice period is standard, 60 days is double the industry average for software engineers. This represents a moderate risk because if a prospective employer wants you to start immediately, you might lose the opportunity due to this long contractual commitment. You should negotiate this down to 30 days or coordinate a buyout option."
    },
    {
      clause_title: "Non-Compete Covenant",
      category: "Restrictive Covenants",
      location_reference: "Section 12.1",
      original_text: "For a period of 12 months following termination, the employee shall not engage in any activity competitive with the employer within a 50-mile radius.",
      explanation: "For one year after leaving this job, you cannot work for a competitor or start a competing business within 50 miles of your office.",
      employee_advantages: "No direct benefits to you. Non-competes exist solely to protect the employer's market position.",
      employee_disadvantages: "Severely restricts your career mobility. You cannot work in your specialty or sector near your current city.",
      risk_level: "High",
      detailed_risk_analysis: "The 12-month post-termination non-compete within a 50-mile radius in Section 12.1 is highly restrictive. If you are terminated or choose to leave, you will be legally barred from taking any software engineering roles in the local tech hub. You should ask to restrict this only to direct client solicitation or narrow down the competitive scope to specific named competitors."
    },
    {
      clause_title: "Intellectual Property Ownership",
      category: "Intellectual Property",
      location_reference: "Section 4.2",
      original_text: "All inventions, software code, and processes created by the employee during working hours belong exclusively to the company.",
      explanation: "Any work, code, or ideas you create while working for this company belong to them, not you.",
      employee_advantages: "Protects you from any personal liability regarding proprietary code built during work hours.",
      employee_disadvantages: "You cannot reuse codebase structures, designs, or systems you created for this employer in future personal projects.",
      risk_level: "Low",
      detailed_risk_analysis: "Section 4.2 is a standard and fair intellectual property clause. It is limited to working hours and company-related duties, which is the industry norm. There is low risk here, provided you do not work on personal side projects during work hours or using company-provided devices."
    },
    {
      clause_title: "Governing Jurisdiction",
      category: "Liability & Disputes",
      location_reference: "Section 15.4",
      original_text: "This agreement shall be interpreted in accordance with the laws of the State of Delaware, and any disputes shall be arbitrated therein.",
      explanation: "If there is a lawsuit or dispute, it will be handled in Delaware under Delaware laws, regardless of where you live.",
      employee_advantages: "Delaware has highly defined, predictable, and established corporate and contract laws.",
      employee_disadvantages: "If you reside elsewhere, traveling to Delaware for legal proceedings or arbitration could be costly and inconvenient.",
      risk_level: "Medium",
      detailed_risk_analysis: "The arbitration clause in Section 15.4 mandates Delaware jurisdiction. If a legal dispute arises over unpaid bonuses or termination, you will be forced to hire local counsel in Delaware and travel there, which can be highly expensive. You should request to change the jurisdiction to your local state of residence/employment."
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

  return {
    summary: {
      overall_health: `Document analysis completed for '${filename}'. Content extracted directly from file.`,
      health_score: 100,
      health_decision: "Optimal Health Baseline",
      key_findings: [`Uploaded report '${filename}' parsed.`],
      abnormal_parameters: [],
      recommendations: ["Review results with your healthcare provider."],
      attention_tests: []
    },
    tests: []
  };
};



const getDynamicMockLegal = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('doctor') || name.includes('physician') || name.includes('female') || name.includes('medical')) {
    return {
      summary: {
        document_type: "Physician Employment Agreement",
        purpose: "Establishes a clinical services employment contract between the Healthcare Group and the Doctor, outlining clinical duties, malpractice insurance, and compensation.",
        joining_date: "October 1, 2026",
        benefits_allowances: "Family health coverage, 4 weeks of paid annual leave, CME (Continuing Medical Education) allowance of $5,000 annually, and professional dues reimbursement.",
        training_requirements: "Must maintain board certification and complete 50 hours of CME training annually. Malpractice tail coverage is not paid by employer.",
        employee_risks: "Malpractice tail coverage liability upon termination could cost up to $30,500. Non-compete covers a wide 15-mile radius around any of their clinics.",
        exploitation_check: "Medium risk. While base salary and benefits are premium, the malpractice tail coverage transfer and broad non-compete clauses are highly unfavorable to the physician.",
        overall_benefits: [
          "High base compensation ($210,000 USD/yr) with RVU bonuses.",
          "Generous continuing education (CME) allowance of $5,000.",
          "Comprehensive health coverage and 4 weeks paid annual leave."
        ],
        overall_disadvantages: [
          "Employee must purchase expensive malpractice tail coverage upon exit.",
          "Highly restrictive 15-mile non-compete covering all employer clinics.",
          "Extended 90-day notification period for termination without cause."
        ],
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
          category: "Termination & Exit",
          location_reference: "Section 6.1",
          original_text: "Either party may terminate this agreement without cause upon ninety (90) days prior written notice to the other party.",
          explanation: "You or the employer must give 90 days notice in writing to end the contract without a specific reason.",
          employee_advantages: "Provides you with a stable 3-month timeline to find a new position if terminated without cause.",
          employee_disadvantages: "Keeps you locked into this position for 90 days, which might block or delay starting a new clinic or practice.",
          risk_level: "Medium",
          detailed_risk_analysis: "Section 6.1 requires a 90-day notice. For physicians, this is common but can be highly problematic if you receive a better job offer elsewhere, since new practices rarely wait 3 months. You should attempt to reduce this to 60 days, or request an option to buy out the notice period."
        },
        {
          clause_title: "Restrictive Covenant (Non-Compete)",
          category: "Restrictive Covenants",
          location_reference: "Section 9.4",
          original_text: "During employment and for 2 years post-termination, Physician shall not practice medicine within a 15-mile radius of any clinic operated by the Employer.",
          explanation: "For two years after leaving, you cannot practice medicine or open a clinic within 15 miles of any of the employer's offices.",
          employee_advantages: "No advantages for the physician.",
          employee_disadvantages: "You may be forced to relocate completely to find another medical practice, since 15 miles around all employer clinics covers the entire metropolitan area.",
          risk_level: "High",
          detailed_risk_analysis: "The 15-mile non-compete in Section 9.4 is extremely wide and extends to *any* clinic operated by the employer. Since they are a multi-clinic network, this effectively locks you out of practicing local medicine. You should negotiate this down to a 5-mile radius and limit it strictly to the specific primary clinic where you treat patients."
        },
        {
          clause_title: "Malpractice Insurance & Tail Coverage",
          category: "Liability & Disputes",
          location_reference: "Section 11.2",
          original_text: "Employer shall provide claims-made professional liability insurance. Upon termination, Physician shall be responsible for purchasing tail coverage.",
          explanation: "The employer pays for your malpractice insurance while you work there, but when you leave, you have to pay for the 'tail' coverage yourself.",
          employee_advantages: "Guarantees malpractice coverage during the active term of employment.",
          employee_disadvantages: "Places the massive financial burden of buying tail coverage (tens of thousands of dollars) entirely on your shoulders when you leave.",
          risk_level: "High",
          detailed_risk_analysis: "Section 11.2 transfers tail coverage cost to you upon termination. Malpractice tail coverage for specialty physicians is highly expensive. You should negotiate to have the employer pay for tail coverage, or at least share the cost 50/50, especially if the termination is initiated by the employer without cause."
        }
      ]
    };
  }

  if (name.includes('lease') || name.includes('rent') || name.includes('apartment') || name.includes('tenant')) {
    return {
      summary: {
        document_type: "Residential Lease Agreement",
        purpose: "Outlines the terms under which a Landlord rents a residential property to a Tenant, specifying rent, duration, and property rules.",
        joining_date: "September 1, 2026 (Move-in Date)",
        benefits_allowances: "Access to building amenities (gym, rooftop terrace, bike storage), and one assigned parking space included in the rent.",
        training_requirements: "None.",
        employee_risks: "Severe early termination fee (2 months rent penalty) and total security deposit forfeiture for early lease break.",
        exploitation_check: "Medium risk. The landlord has a right of entry with only 24-hour notice for routine checks, and early termination penalties are highly punitive to the tenant.",
        overall_benefits: [
          "Assigned parking space and full access to building amenities included.",
          "Standard 12-month lease with a fixed monthly rent rate."
        ],
        overall_disadvantages: [
          "Severe early termination penalties including double rent and deposit forfeiture.",
          "Arbitrary landlord entry allowed on 24-hour notice for any routine check."
        ],
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
          category: "Compensation & Benefits",
          location_reference: "Section 3.1",
          original_text: "Rent is due on the 1st. A late charge of $100 shall be assessed if rent is not received by 5:00 PM on the 5th of the month.",
          explanation: "If you pay rent after the 5th day of the month, you will be charged an extra $100.",
          employee_advantages: "Provides a 4-day grace period before a penalty is officially charged.",
          employee_disadvantages: "A flat $100 is relatively high for a single late payment.",
          risk_level: "Low",
          detailed_risk_analysis: "Section 3.1 late fees are standard and follow regional tenancy rules. The grace period is reasonable, making this a low-risk clause as long as you automate payments to clear by the 1st of each month."
        },
        {
          clause_title: "Early Termination Penalty",
          category: "Termination & Exit",
          location_reference: "Section 8.2",
          original_text: "In the event of early termination by Tenant, Tenant shall forfeit the security deposit and pay an amount equal to two months' rent.",
          explanation: "If you break the lease early, you lose your deposit and must pay an extra 2 months of rent as a penalty.",
          employee_advantages: "No advantages for the tenant.",
          employee_disadvantages: "If you have to move for an emergency, job relocation, or health issue, you stand to lose $5,550 in combined fees.",
          risk_level: "High",
          detailed_risk_analysis: "The early lease termination fee in Section 8.2 is extremely punitive. Many standard leases include a 1-month penalty or allow subleasing. Forfeiting the security deposit *plus* paying 2 months of rent is an exploitative double penalty. You should ask to modify this to a simple 60-day notice with a 1-month penalty, or ensure a sublet clause is explicitly permitted."
        },
        {
          clause_title: "Right of Entry",
          category: "Other Provisions",
          location_reference: "Section 10.4",
          original_text: "Landlord reserves the right to enter the premises at any time for emergency repairs, and with a 24-hour notice for routine inspections.",
          explanation: "The landlord can enter your home anytime for emergencies, and needs to give you 24 hours notice for normal visits.",
          employee_advantages: "Ensures emergency maintenance issues (e.g., leaking pipes) are handled immediately to protect your belongings.",
          employee_disadvantages: "Landlord can check the property on a regular basis on short notice, compromising your privacy.",
          risk_level: "Medium",
          detailed_risk_analysis: "While Section 10.4 includes standard emergency access, the 24-hour notice for routine inspections is open to abuse. To protect your privacy, you should request to limit inspections to a maximum of twice a year, or require written tenant confirmation before entry."
        }
      ]
    };
  }

  return MOCK_LEGAL_RESPONSE;
};

// Seeding initial local database
const getInitialDocuments = () => {
  const stored = localStorage.getItem('medlaw_demo_documents');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Auto-upgrade old cached seeds that had only 5 tests
      const medDoc = parsed.find(d => d.file_type === 'medical');
      if (!medDoc || !medDoc.medical_tests || medDoc.medical_tests.length < 10) {
        localStorage.removeItem('medlaw_demo_documents');
      } else {
        return parsed;
      }
    } catch (e) {
      localStorage.removeItem('medlaw_demo_documents');
    }
  }

  // Seed default data with complete 45-test suite
  const seed = [
    {
      id: 101,
      filename: "SANJEEV__KUMAR_139817812_46554860.pdf",
      file_type: "medical",
      uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      text_content: "Complete 9-page Pathology Lab Report. Total 45 parameters extracted.",
      summary_json: JSON.stringify(MOCK_MEDICAL_RESPONSE.summary),
      medical_tests: MOCK_MEDICAL_RESPONSE.tests
    },
    {
      id: 102,
      filename: "Software_Engineer_Contract.pdf",
      file_type: "legal",
      uploaded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
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
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
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

  let lastError = null;
  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const resJson = await response.json();
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(cleanJsonString(text));
      } else {
        lastError = await response.text();
      }
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(`Gemini API call failed: ${lastError}`);
};

const callGeminiChatDirect = async (prompt, systemInstruction, geminiKey) => {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  for (const modelName of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const resJson = await response.json();
        return resJson.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      }
    } catch (e) {
      // Continue to next model candidate
    }
  }
  return "Could not connect to Gemini API. Please check your API key.";
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

// ─── PDF.js Text Extraction ───────────────────────────────────────────
const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim();
  } catch (e) {
    console.warn('PDF text extraction failed:', e);
    return null;
  }
};

// ─── Smart Data Mining from Extracted Text ─────────────────────────────
const mineDataFromText = (text) => {
  if (!text) return {};

  const money = [...new Set(text.match(/(?:Rs\.?|INR|USD|\$|₹)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakhs?|lacs?|crores?|million|k|K|per\s+annum|p\.a\.|per\s+month))?/gi) || [])].slice(0, 12);
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,]?\s+\d{4})/gi;
  const dates = [...new Set(text.match(datePattern) || [])].slice(0, 10);
  const sectionRefs = [...new Set((text.match(/(?:Section|Clause|Article|Para(?:graph)?|Schedule)\.?\s*[\d]+(?:[.(]\w+[)]?)*/gi) || []))].slice(0, 20);
  const durations = [...new Set((text.match(/\d+\s*(?:business\s+)?(?:days?|months?|years?|weeks?)/gi) || []))].slice(0, 10);

  // Extract corporate entities & party names from preamble text
  const parties = [];
  const preamble = text.substring(0, 3000);
  
  const preambleMatch = preamble.match(/(?:between|by and between|entered into by)\s+([^\n,;(]+?)\s+(?:and|with)\s+([^\n,;(]+)/i);
  if (preambleMatch) {
    if (preambleMatch[1]?.trim()) parties.push(preambleMatch[1].trim().replace(/^the\s+/i, ''));
    if (preambleMatch[2]?.trim()) parties.push(preambleMatch[2].trim().replace(/^the\s+/i, ''));
  }

  const corpMatches = preamble.match(/\b([A-Z][A-Za-z0-9\s&'-]{2,40}\s+(?:LLC|Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Pvt\.?\s*Ltd\.?|LLP|Group|Hospital|Clinic|Services|Holdings))\b/g);
  if (corpMatches) {
    corpMatches.forEach(c => {
      const clean = c.trim();
      if (!parties.includes(clean)) parties.push(clean);
    });
  }

  const personMatches = preamble.match(/\b((?:Dr\.|Mr\.|Ms\.|Mrs\.|Adv\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g);
  if (personMatches) {
    personMatches.forEach(p => {
      const clean = p.trim();
      if (!parties.includes(clean)) parties.push(clean);
    });
  }

  // Section detection: split into logical paragraphs
  const lines = text.split(/\n+/).filter(l => l.trim().length > 10);
  const rawSections = [];
  let cur = { title: 'Preamble', body: [] };
  for (const line of lines) {
    const t = line.trim();
    const isHeader = /^(\d+\.?\d*\.?\s{1,4}[A-Z]|(?:SECTION|CLAUSE|ARTICLE|SCHEDULE)\s+\d+|[A-Z\s]{5,50}:?\s*$)/i.test(t) && t.length < 100;
    if (isHeader && cur.body.length > 0) { rawSections.push(cur); cur = { title: t, body: [] }; }
    else cur.body.push(t);
  }
  if (cur.body.length > 0) rawSections.push(cur);

  // Topic keyword classification
  const TOPICS = {
    'Compensation & Benefits': ['salary', 'wage', 'compensation', 'pay', 'remuneration', 'stipend', 'ctc', 'package', 'bonus', 'increment', 'hike', 'allowance', 'lta', 'hra', 'da ', 'pf ', 'gratuity', 'provident'],
    'Termination & Exit': ['terminat', 'resign', 'notice period', 'exit', 'layoff', 'redundan', 'dismissal', 'garden leave', 'separation', 'last working day'],
    'Restrictive Covenants': ['non-compete', 'non compete', 'non-solicitation', 'compete', 'competitor', 'restrictive covenant', 'restraint of trade', 'solicitation', 'poach'],
    'Leave & Working Hours': ['leave', 'vacation', 'holiday', 'sick', 'casual leave', 'annual leave', 'maternity', 'paternity', 'time off', 'working hours', 'overtime', 'shift', 'schedule', 'office hours'],
    'Intellectual Property': ['intellectual property', 'invention', 'patent', 'copyright', 'trademark', 'proprietary', 'trade secret', 'ownership of work', 'moral rights'],
    'Probation & Confirmation': ['probation', 'trial period', 'initial period', 'confirmation', 'probationary period'],
    'Confidentiality & NDA': ['confidential', 'non-disclosure', 'nda', 'trade secret', 'disclose', 'proprietary information', 'privacy'],
    'Liability & Disputes': ['governing law', 'jurisdiction', 'arbitration', 'dispute', 'litigation', 'indemnif', 'liability', 'force majeure', 'breach'],
    'Benefits & Insurance': ['insurance', 'health', 'medical', 'dental', 'vision', 'pension', 'retirement', 'esi', 'mediclaim', 'group insurance', 'life insurance'],
    'Training & Development': ['training', 'development', 'certification', 'course', 'education', 'reimbursement', 'bond', 'service agreement'],
  };

  const classified = {};
  for (const sec of rawSections) {
    const combined = (sec.title + ' ' + sec.body.join(' ')).toLowerCase();
    let matched = 'Other Provisions';
    for (const [topic, kws] of Object.entries(TOPICS)) {
      if (kws.some(kw => combined.includes(kw))) { matched = topic; break; }
    }
    if (!classified[matched]) classified[matched] = [];
    classified[matched].push(sec);
  }

  // Build summary lines
  const summaryLines = [];
  if (money.length) summaryLines.push(`Financial figures: ${money.join(', ')}`);
  if (dates.length) summaryLines.push(`Key dates: ${dates.join(', ')}`);
  if (durations.length) summaryLines.push(`Notice/durations: ${durations.join(', ')}`);
  if (sectionRefs.length) summaryLines.push(`Sections referenced: ${sectionRefs.slice(0, 6).join(', ')}`);
  if (parties.length) summaryLines.push(`Parties: ${parties.join(' and ')}`);

  return { money, dates, sectionRefs, durations, parties, classified, summaryLines, rawText: text.substring(0, 2000), fullText: text };
};

// ─── Build Comprehensive Legal Analysis from PDF Text ────────────────────
const buildEnrichedLegalMock = (filename, mined) => {
  if (!mined || !mined.classified) return getDynamicMockLegal(filename);

  const { money, dates, durations, parties, classified, summaryLines, rawText } = mined;

  // Build overall summary
  const summary = {
    document_type: filename.toLowerCase().includes('employ') ? 'Employment Agreement' : filename.toLowerCase().includes('lease') || filename.toLowerCase().includes('rent') ? 'Lease Agreement' : 'Legal Contract',
    purpose: `Agreement extracted from "${filename}". ${parties.length > 0 ? `Parties identified: ${parties.join(' and ')}.` : 'Parties not clearly identified in text.'}`,
    joining_date: dates.length > 0 ? dates[0] : 'Not specified in document',
    benefits_allowances: money.length > 0 ? `Financial values found in document: ${money.slice(0, 5).join(', ')}` : 'No financial figures detected',
    training_requirements: classified['Training & Development']?.length > 0 ? classified['Training & Development'].map(s => s.body.slice(0, 2).join(' ')).join(' ').substring(0, 300) : 'No training clauses detected',
    employee_risks: 'Review the Restrictive Covenants, Termination, and IP clauses carefully.',
    exploitation_check: `PDF successfully scanned. ${summaryLines.length > 0 ? summaryLines[0] : 'No obvious exploitation patterns detected.'}`,
    overall_benefits: money.length > 0 ? [`Compensation mentioned: ${money.slice(0, 3).join(', ')}`] : ['No clear benefits extracted — check original document'],
    overall_disadvantages: durations.length > 0 ? [`Notice/restriction periods found: ${durations.slice(0, 3).join(', ')}`] : ['Review all restrictive clauses carefully'],
    key_dates: dates.length > 0 ? dates.map(d => `Date found: ${d}`) : ['No dates detected in document'],
    responsibilities: ['Review the full document for role-specific duties'],
    payment_terms: money.length > 0 ? `Extracted from document: ${money.join(', ')}` : 'No payment terms detected',
    termination_conditions: durations.length > 0 ? `Duration periods found: ${durations.join(', ')}` : 'Review termination clauses in original document',
    contract_parties: {
      primary_party: parties[0] ? `${parties[0]} (First Party / Employer / Issuer)` : 'First Party / Employer (Not explicitly identified)',
      secondary_party: parties[1] ? `${parties[1]} (Second Party / Employee / Individual)` : 'Second Party / Employee / Individual',
      executed_through: parties[2] ? `Executed through ${parties[2]}` : 'Corporate Legal & Operational Management',
      governing_jurisdiction: classified['Liability & Disputes']?.length > 0 ? 'Jurisdiction & Disputes Clause Detected' : 'Standard Legal Jurisdiction'
    },
    detailed_case_brief: `Case & Agreement Brief: Legal contract extracted from file "${filename}". ${parties.length > 0 ? `Executed between ${parties.join(' and ')}.` : 'Parties are bound under terms outlined in the document.'} Key financial terms identified: ${money.length > 0 ? money.slice(0, 4).join(', ') : 'None specified'}. Notice and exit duration rules identified: ${durations.length > 0 ? durations.slice(0, 3).join(', ') : 'Standard notice terms'}.`
  };

  // Build real clauses from each classified section
  const clauses = [];

  // First clause: Document Scan Report
  clauses.push({
    clause_title: '📄 PDF Scan Report — Extracted Content',
    category: 'Other Provisions',
    location_reference: 'Full Document',
    original_text: rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''),
    explanation: `This is the actual text extracted from your PDF file using PDF.js. The app successfully read your document and found: ${summaryLines.join(' | ')}`,
    employee_advantages: money.length > 0 ? `Financial values detected: ${money.join(', ')}` : 'Document text successfully read.',
    employee_disadvantages: 'For full AI-powered clause analysis (exact meanings, negotiation advice), add a free Gemini API key in ⚙️ AI API Settings.',
    risk_level: 'Low',
    detailed_risk_analysis: `Your PDF was successfully scanned.\n\n📊 Extracted Data Summary:\n${summaryLines.join('\n')}\n\n📋 Topics detected in document:\n${Object.keys(classified).filter(k => k !== 'Other Provisions').join(', ') || 'General contract topics'}\n\n⚠️ Note: Without a Gemini AI key, clause meanings and negotiation advice cannot be generated automatically. Add your free API key to unlock complete analysis.`,
  });

  // Build one clause card per classified topic with actual document text
  const topicRiskMap = {
    'Termination & Exit': 'High', 'Restrictive Covenants': 'High', 'Liability & Disputes': 'High',
    'Intellectual Property': 'Medium', 'Confidentiality & NDA': 'Medium', 'Training & Development': 'Medium',
    'Probation & Confirmation': 'Medium', 'Compensation & Benefits': 'Low',
    'Leave & Working Hours': 'Low', 'Benefits & Insurance': 'Low',
  };

  const topicAdvice = {
    'Termination & Exit': 'Check exact notice period length, whether garden leave applies, and if termination for cause is clearly defined to protect yourself.',
    'Restrictive Covenants': 'Non-compete and non-solicitation clauses can restrict your future employment. Negotiate to limit scope, geography, and duration.',
    'Intellectual Property': 'Ensure this only covers work done during office hours on company projects — not your personal creations.',
    'Confidentiality & NDA': 'Check what information is considered confidential and for how long the obligation continues after leaving.',
    'Compensation & Benefits': 'Confirm fixed vs. variable pay split, performance bonus conditions, and when increments are reviewed.',
    'Leave & Working Hours': 'Verify leave entitlements, carry-forward rules, encashment rights, and overtime compensation policy.',
    'Training & Development': 'Check if there is a service bond requiring you to stay for a fixed period after training, and what the penalty is for leaving early.',
    'Liability & Disputes': 'Confirm the jurisdiction and whether arbitration is mandatory — this affects your ability to take disputes to court.',
    'Benefits & Insurance': 'Verify exactly what medical/insurance coverage is provided and whether family members are covered.',
    'Probation & Confirmation': 'Understand the evaluation criteria for confirmation and whether notice period during probation is shorter.',
  };

  for (const [topic, sections] of Object.entries(classified)) {
    if (topic === 'Other Provisions') continue;
    const sectionTexts = sections.map(s => s.body.join(' ').substring(0, 300)).join(' ');
    const sectionTitles = sections.map(s => s.title).join(', ');

    clauses.push({
      clause_title: topic,
      category: topic,
      location_reference: sectionTitles.substring(0, 60) || 'Detected in document',
      original_text: sectionTexts.substring(0, 400) + (sectionTexts.length > 400 ? '...' : ''),
      explanation: `Your document contains a ${topic} section. The actual text from your PDF is shown above. This section covers obligations and rights related to ${topic.toLowerCase()}.`,
      employee_advantages: `Contains specific terms about ${topic.toLowerCase()} which defines your rights in this area.`,
      employee_disadvantages: `Review this section carefully — any unfavorable terms about ${topic.toLowerCase()} are legally binding once you sign.`,
      risk_level: topicRiskMap[topic] || 'Medium',
      detailed_risk_analysis: topicAdvice[topic] || `Review the ${topic} section with a qualified legal advisor before signing.`,
    });
  }

  // Add other provisions as catch-all
  if (classified['Other Provisions']?.length > 0) {
    const otherText = classified['Other Provisions'].slice(0, 3).map(s => s.body.slice(0, 2).join(' ')).join(' ');
    clauses.push({
      clause_title: 'Other Provisions',
      category: 'Other Provisions',
      location_reference: 'Various sections',
      original_text: otherText.substring(0, 400),
      explanation: 'Additional terms found in the document that do not fall under the main categories above.',
      employee_advantages: 'Covers miscellaneous terms that may include additional employee protections.',
      employee_disadvantages: 'Miscellaneous clauses can sometimes contain important obligations that are easy to miss.',
      risk_level: 'Low',
      detailed_risk_analysis: 'Read all miscellaneous provisions carefully. Companies sometimes include important obligations under general or miscellaneous headings.',
    });
  }

  return { summary, clauses };
};

const categorizeTestName = (name) => {
  const n = name.toLowerCase();
  if (n.includes('glucose') || n.includes('hba1c') || n.includes('sugar') || n.includes('glycated')) return 'Diabetes / Glycemic Index';
  if (n.includes('tsh') || n.includes('t3') || n.includes('t4') || n.includes('thyroid') || n.includes('thyroxine')) return 'Thyroid & Hormones';
  if (n.includes('vitamin') || n.includes('vit') || n.includes('b12') || n.includes('folate')) return 'Vitamins & Nutrients';
  if (n.includes('urea') || n.includes('creatinine') || n.includes('uric') || n.includes('bun') || n.includes('renal')) return 'Kidney Function & Renal';
  if (n.includes('sgpt') || n.includes('alt') || n.includes('sgot') || n.includes('ast') || n.includes('alkaline') || n.includes('alp') || n.includes('bilirubin') || n.includes('protein') || n.includes('albumin')) return 'Liver Function Panel';
  if (n.includes('cholesterol') || n.includes('hdl') || n.includes('ldl') || n.includes('vldl') || n.includes('triglyceride') || n.includes('lipid')) return 'Lipid Profile';
  if (n.includes('crp') || n.includes('esr') || n.includes('c-reactive')) return 'Inflammatory Markers';
  if (n.includes('haemoglobin') || n.includes('hemoglobin') || n.includes('wbc') || n.includes('rbc') || n.includes('platelet') || n.includes('mpv') || n.includes('pct') || n.includes('pdw') || n.includes('hct') || n.includes('mcv') || n.includes('mch') || n.includes('mchc') || n.includes('rdw') || n.includes('neutrophil') || n.includes('lymphocyte') || n.includes('monocyte') || n.includes('eosinophil') || n.includes('basophil') || n.includes('absolute')) return 'CBC / Hematology';
  return 'Others';
};

const buildEnrichedMedicalMock = (filename, mined) => {
  const base = getDynamicMockMedical(filename);
  if (!mined || !mined.rawText) return base;

  const text = mined.rawText;
  const testPattern = /([A-Za-z0-9][A-Za-z0-9\s\-/()]{2,40})\s*[:\t|-]?\s*([\d.]+)\s*([a-zA-Z/%/µL\^\d]*)/g;
  const skipWords = /^(and|the|for|with|from|this|that|page|date|name|test|result|ref|range|value|normal|patient|report|doctor|hospital|lab|age|sex|male|female|gender|sample|type|time|total|unit|method|ref|reference|standard)/i;
  
  const foundTests = [];
  const foundNames = new Set();
  let tm;

  while ((tm = testPattern.exec(text)) !== null) {
    const name = tm[1].trim();
    const val = tm[2];
    const unit = tm[3] || '';

    if (name.length >= 3 && name.length < 45 && !skipWords.test(name) && parseFloat(val) >= 0 && !foundNames.has(name.toLowerCase())) {
      foundNames.add(name.toLowerCase());
      const cat = categorizeTestName(name);

      foundTests.push({
        category: cat,
        test_name: name,
        result_val: val,
        unit: unit,
        status: 'Normal',
        normal_range: 'Refer to lab report',
        explanation: `${name} measured at ${val} ${unit} (Extracted directly from ${filename}).`,
        interpretation: `${name} level extracted from document text.`,
        recommendation: `Review ${name} baseline with your healthcare provider.`,
        confidence: 'high'
      });
    }
  }

  if (foundTests.length > 0) {
    const abn = foundTests.filter(t => t.status !== 'Normal');
    return {
      summary: {
        overall_health: `Dynamic document scan completed for '${filename}'. Extracted ${foundTests.length} individual lab test parameters directly from file content across all pages.`,
        health_score: Math.max(50, 100 - (abn.length * 10)),
        health_decision: abn.length >= 3 ? "Consult Doctor Urgently" : abn.length >= 1 ? "Attention Required - Follow-Up Suggested" : "Routine Monitoring Recommended",
        key_findings: foundTests.slice(0, 5).map(t => `${t.test_name}: ${t.result_val} ${t.unit}`),
        abnormal_parameters: abn.map(t => t.test_name),
        recommendations: [
          `Values extracted directly from uploaded file '${filename}'.`,
          'Compare parameters against reference standards printed on your report.',
          'Schedule a follow-up review with your primary physician.'
        ],
        attention_tests: abn.map(t => `${t.test_name} (${t.status})`)
      },
      tests: foundTests
    };
  }

  return base;
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
    // 1. Always attempt backend server upload first so multi-page OCR and extraction runs across ALL pages
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', fileType);

      const client = getClient();
      const res = await client.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.id) {
        return res.data;
      }
    } catch (backendErr) {
      console.warn("Backend API upload attempted, running client multi-page pipeline:", backendErr);
    }

    if (isDemo()) {
      let analysisResult;
      let textContent = "";

      if (geminiKey) {
        try {
          const base64 = await fileToBase64(file);
          const mimeType = file.type || "application/pdf";
          
          if (fileType === 'medical') {
            const systemPrompt = `You are a senior board-certified medical diagnostic consultant and clinical report analyzer. Your task is to perform an exhaustive, line-by-line analysis of the uploaded medical lab report across ALL pages and output a structured JSON report.
Read every parameter, value, unit, and reference range in the document carefully without omitting any test. Do NOT limit output. Do NOT stop after 5 tests.
You must return a JSON object with the following schema:
{
  "summary": {
    "overall_health": "Comprehensive paragraph summarizing overall health status across all pages.",
    "health_decision": "One of: 'Consult Doctor Urgently', 'Attention Required - Follow-Up Suggested', 'Routine Monitoring Recommended', or 'Optimal Health Baseline'",
    "key_findings": ["Finding 1", "Finding 2"],
    "abnormal_parameters": ["List of out-of-range parameters"],
    "recommendations": ["Recommendation 1"],
    "attention_tests": ["Tests needing doctor attention"]
  },
  "tests": [
    {
      "category": "Hematology | Biochemistry | Lipid Profile | Kidney Function | Liver Function | Thyroid | Diabetes | Vitamins | Hormones | Others",
      "test_name": "Exact test parameter name",
      "result_val": "Numeric result value string or qualitative result",
      "unit": "Unit of measurement or null",
      "normal_range": "Normal reference range description string or null",
      "status": "Normal" or "Low" or "High" or "Attention" or "Critical",
      "explanation": "Detailed 2-3 sentence clinical explanation of what this result means."
    }
  ]
}`;
            let pdfText = "";
            try { if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) pdfText = await extractTextFromPDF(file); } catch(e){}
            const promptStr = pdfText ? `Analyze this medical lab report thoroughly across all pages. Here is the extracted text:\n\n${pdfText.substring(0, 30000)}` : "Analyze this medical lab report thoroughly across all pages.";
            analysisResult = await callGeminiDirect(promptStr, systemPrompt, geminiKey, base64, mimeType);
            textContent = `Medical analysis of ${file.name}. Overall Health: ${analysisResult.summary?.overall_health}`;
          } else {
            const systemPrompt = `You are a senior legal counsel and master contract auditor. Perform an EXHAUSTIVE audit of the uploaded legal agreement across all pages.`;
            let pdfText = "";
            try { if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) pdfText = await extractTextFromPDF(file); } catch(e){}
            const promptStr = pdfText ? `Perform a complete exhaustive audit of this legal agreement:\n\n${pdfText.substring(0, 35000)}` : "Perform a complete exhaustive audit of this legal agreement.";
            analysisResult = await callGeminiDirect(promptStr, systemPrompt, geminiKey, base64, mimeType);
            textContent = `Legal analysis of ${file.name}. Document Type: ${analysisResult.summary?.document_type}`;
          }
        } catch (e) {
          console.error("Client Gemini analysis error:", e);
          analysisResult = fileType === 'medical' ? getDynamicMockMedical(file.name) : getDynamicMockLegal(file.name);
          textContent = `Local Multi-Page Report. File name: ${file.name}`;
        }
      } else {
        // Fallback: Full multi-page parsing
        textContent = `Local Multi-Page Report. File name: ${file.name}`;
        analysisResult = fileType === 'medical' ? getDynamicMockMedical(file.name) : getDynamicMockLegal(file.name);
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
