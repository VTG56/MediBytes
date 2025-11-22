import { useState } from 'react';
import { analyzeLabReport, analyzeText, AnalysisData, LabValue } from '../services/mlApi';

export function LabReportAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeLabReport(file);
      setExtractedText(result.extracted_text);

      if (typeof result.analysis === 'object') {
        setAnalysis(result.analysis as AnalysisData);
      } else {
        setAnalysis({ summary: result.analysis });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!manualInput.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeText(manualInput);

      if (typeof result.analysis === 'object') {
        setAnalysis(result.analysis as AnalysisData);
      } else {
        setAnalysis({ summary: result.analysis });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIGH':
        return 'text-red-600 bg-red-50';
      case 'LOW':
        return 'text-orange-600 bg-orange-50';
      case 'NORMAL':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRowColor = (status: string) => {
    switch (status) {
      case 'HIGH':
        return 'bg-red-50 hover:bg-red-100';
      case 'LOW':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'NORMAL':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* File Upload */}
      <div className="mb-6 p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Upload Lab Report</h3>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="mb-3 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          onClick={handleAnalyzeFile}
          disabled={!file || loading}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Report'}
        </button>
      </div>

      {/* Manual Input */}
      <div className="mb-6 p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-3">Or Enter Values Manually</h3>
        <textarea
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Enter your lab values, for example:&#10;Hemoglobin: 12.5 g/dL&#10;Glucose: 145 mg/dL&#10;WBC: 9000"
          className="w-full h-32 p-3 border border-slate-200 rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          onClick={handleAnalyzeText}
          disabled={!manualInput.trim() || loading}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze Values'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl text-center">
          <p className="text-blue-700 font-medium">Analyzing your report...</p>
          <p className="text-blue-600 text-sm">This may take 15-30 seconds</p>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-5">
          
          {/* Summary - Overall Assessment */}
          {analysis.summary && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">📋 Overall Health Assessment</h3>
              <p className="text-blue-900 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
            </div>
          )}

          {/* Lab Values Table */}
          {analysis.values && analysis.values.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 text-lg">🧪 Lab Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Test</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Your Value</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Normal Range</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {analysis.values.map((item: LabValue, index: number) => (
                      <tr key={index} className={`${getRowColor(item.status)} transition-colors`}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.test}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.value} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{item.reference}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status === 'HIGH' && '↑ '}
                            {item.status === 'LOW' && '↓ '}
                            {item.status === 'NORMAL' && '✓ '}
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span> Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span> Low
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span> High
                </span>
              </div>
            </div>
          )}

          {/* Concerns */}
          {analysis.concerns && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="font-semibold text-red-900 mb-3 text-lg">⚠️ Areas of Concern</h3>
              <p className="text-red-900 leading-relaxed whitespace-pre-line">{analysis.concerns}</p>
            </div>
          )}

          {/* Positive */}
          {analysis.positive && (
            <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="font-semibold text-green-900 mb-3 text-lg">✅ What's Healthy</h3>
              <p className="text-green-900 leading-relaxed whitespace-pre-line">{analysis.positive}</p>
            </div>
          )}

          {/* Diet - Increase */}
          {analysis.diet_increase && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="font-semibold text-emerald-900 mb-3 text-lg">🥗 Foods to Eat More</h3>
              <p className="text-emerald-900 leading-relaxed whitespace-pre-line">{analysis.diet_increase}</p>
            </div>
          )}

          {/* Diet - Reduce */}
          {analysis.diet_reduce && (
            <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h3 className="font-semibold text-yellow-900 mb-3 text-lg">⚖️ Foods to Cut Down</h3>
              <p className="text-yellow-900 leading-relaxed whitespace-pre-line">{analysis.diet_reduce}</p>
            </div>
          )}

          {/* Diet - Avoid */}
          {analysis.diet_avoid && (
            <div className="p-5 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="font-semibold text-orange-900 mb-3 text-lg">🚫 Foods to Avoid</h3>
              <p className="text-orange-900 leading-relaxed whitespace-pre-line">{analysis.diet_avoid}</p>
            </div>
          )}

          {/* Lifestyle */}
          {analysis.lifestyle && (
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-xl">
              <h3 className="font-semibold text-purple-900 mb-3 text-lg">🏃 Lifestyle Recommendations</h3>
              <p className="text-purple-900 leading-relaxed whitespace-pre-line">{analysis.lifestyle}</p>
            </div>
          )}

          {/* Doctor Visit */}
          {analysis.doctor_visit && (
            <div className="p-5 bg-pink-50 border border-pink-200 rounded-xl">
              <h3 className="font-semibold text-pink-900 mb-3 text-lg">👨‍⚕️ Doctor Visit</h3>
              <p className="text-pink-900 leading-relaxed whitespace-pre-line">{analysis.doctor_visit}</p>
            </div>
          )}

          {/* Recommendations - Action Items */}
          {analysis.recommendations && (
            <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
              <h3 className="font-semibold text-indigo-900 mb-3 text-lg">📝 Action Items & Next Steps</h3>
              <p className="text-indigo-900 leading-relaxed whitespace-pre-line">{analysis.recommendations}</p>
            </div>
          )}
        </div>
      )}

      {/* Extracted Text (Collapsible) */}
      {extractedText && (
        <details className="mt-6">
          <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
            View Extracted Text from Image
          </summary>
          <pre className="mt-3 p-4 bg-slate-100 rounded-lg text-sm whitespace-pre-wrap text-slate-700">
            {extractedText}
          </pre>
        </details>
      )}

      {/* Disclaimer */}
      {analysis && (
        <p className="mt-6 text-xs text-slate-400 text-center">
          This is AI-generated advice. Always consult a healthcare professional for diagnosis and treatment.
        </p>
      )}
    </div>
  );
}