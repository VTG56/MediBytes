const ML_API = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000/api';

const headers = {
  'ngrok-skip-browser-warning': 'true'
};

/**
 * Health check
 */
export async function checkMLHealth(): Promise<{ status: string; model: string }> {
  const response = await fetch(`${ML_API}/health`, { headers });
  if (!response.ok) throw new Error('ML service unavailable');
  return response.json();
}

/**
 * OCR only
 */
export async function extractText(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ML_API}/ocr`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) throw new Error('OCR extraction failed');
  return response.json();
}

/**
 * Types
 */
export interface LabValue {
  test: string;
  value: string;
  unit: string;
  reference: string;
  status: 'HIGH' | 'LOW' | 'NORMAL';
}

export interface AnalysisData {
  summary?: string;              // Overall health assessment
  values?: LabValue[];           // Lab values table with HIGH/LOW/NORMAL
  concerns?: string;             // What's wrong
  positive?: string;             // What's healthy
  diet_increase?: string;        // Foods to eat more
  diet_reduce?: string;          // Foods to cut down
  diet_avoid?: string;           // Foods to avoid completely
  lifestyle?: string;            // Lifestyle recommendations
  doctor_visit?: string;         // Required? Urgency? Which specialist?
  recommendations?: string;      // Action items and next steps
}

export interface AnalysisResult {
  extracted_text: string;
  analysis: AnalysisData | string;
}

/**
 * Full analysis - OCR + AI insights
 */
export async function analyzeLabReport(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ML_API}/analyze`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}

/**
 * Analyze manually entered lab values
 */
export async function analyzeText(labValues: string): Promise<{ analysis: AnalysisData | string }> {
  const response = await fetch(`${ML_API}/analyze-text`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lab_values: labValues })
  });

  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
}

// Add to frontend/src/services/mlApi.ts

export async function extractTextFromReport(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ML_API}/ocr`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    body: formData
  });

  if (!response.ok) throw new Error('OCR extraction failed');
  return response.json();
}