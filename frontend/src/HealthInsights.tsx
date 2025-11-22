import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeLabReport, AnalysisData, LabValue } from './services/mlApi'

// Icons
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M9 17V11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M15 19.92L8.48003 13.4C7.71003 12.63 7.71003 11.37 8.48003 10.6L15 4.07996" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M12 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21.41H5.94C2.47 21.41 1.02 18.93 2.7 15.9L5.82 10.28L8.76 5.00003C10.54 1.79003 13.46 1.79003 15.24 5.00003L18.18 10.29L21.3 15.91C22.98 18.94 21.52 21.42 18.06 21.42H12V21.41Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9946 17H12.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function HealthInsights() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPG, PNG) or PDF file')
      return
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    
    setFile(selectedFile)
    setError('')
    setAnalysis(null)
    setExtractedText('')
  }

  const handleAnalyze = async () => {
    if (!file) return

    setLoading(true)
    setError('')
    
    try {
      const result = await analyzeLabReport(file)
      
      setExtractedText(result.extracted_text || '')
      
      if (typeof result.analysis === 'object') {
        setAnalysis(result.analysis as AnalysisData)
      } else {
        setAnalysis({ summary: result.analysis })
      }
    } catch (err: any) {
      console.error('Analysis error:', err)
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Cannot connect to AI service. Please check if the ML server is running.')
      } else {
        setError(err.message || 'Failed to analyze report')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      case 'LOW': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'NORMAL': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRowColor = (status: string) => {
    switch (status) {
      case 'HIGH': return 'bg-red-50 hover:bg-red-100'
      case 'LOW': return 'bg-orange-50 hover:bg-orange-100'
      case 'NORMAL': return 'bg-green-50 hover:bg-green-100'
      default: return 'bg-white hover:bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Health Insights AI</h1>
              <p className="text-sm text-slate-500">Upload your lab report for AI-powered analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Upload Lab Report</h2>
              
              {/* Drag and Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="pointer-events-none">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                    <UploadIcon />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    {file ? file.name : 'Drop your lab report here'}
                  </p>
                  <p className="text-sm text-slate-500">
                    or click to browse • JPG, PNG, PDF up to 10MB
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertIcon />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {file && !loading && !analysis && (
                <button
                  onClick={handleAnalyze}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold shadow-button hover:shadow-button-hover transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Analyze Report
                </button>
              )}

              {loading && (
                <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <SpinnerIcon />
                    <div>
                      <p className="font-semibold text-primary-900">Analyzing your report...</p>
                      <p className="text-sm text-primary-700">This may take 15-30 seconds</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Text */}
            {extractedText && (
              <details className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900">
                  View Extracted Text
                </summary>
                <div className="mt-3 p-4 bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{extractedText}</pre>
                </div>
              </details>
            )}
          </div>

          {/* Results Section */}
          <div>
            {analysis ? (
              <div className="space-y-6">
                
                {/* Summary - Overall Assessment */}
                {analysis.summary && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-semibold text-blue-900 mb-3 text-lg">📋 Overall Health Assessment</h3>
                    <p className="text-blue-900 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
                  </div>
                )}

                {/* Lab Values Table */}
                {analysis.values && analysis.values.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-900 text-lg">🧪 Lab Results</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Test</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Value</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Range</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {analysis.values.map((item: LabValue, index: number) => (
                            <tr key={index} className={`${getRowColor(item.status)} transition-colors`}>
                              <td className="px-4 py-3 font-medium text-slate-900">{item.test}</td>
                              <td className="px-4 py-3 text-slate-700">{item.value} {item.unit}</td>
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
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Normal</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Low</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> High</span>
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

                {/* Recommendations */}
                {analysis.recommendations && (
                  <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h3 className="font-semibold text-indigo-900 mb-3 text-lg">📝 Action Items & Next Steps</h3>
                    <p className="text-indigo-900 leading-relaxed whitespace-pre-line">{analysis.recommendations}</p>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-slate-400 text-center">
                  This is AI-generated advice. Always consult a healthcare professional for diagnosis and treatment.
                </p>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setFile(null)
                    setAnalysis(null)
                    setExtractedText('')
                    setError('')
                  }}
                  className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Analyze Another Report
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-slate-300">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7.75 12L9.25 10.5L11.25 12.5L14.75 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Analysis Yet</h3>
                <p className="text-slate-500">
                  Upload a lab report to get AI-powered health insights
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}