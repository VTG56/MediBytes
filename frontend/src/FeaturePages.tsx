import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import toast, { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { extractTextFromReport } from './services/mlApi'; 

// Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M9.57 5.93L3.5 12L9.57 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 12H3.67" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29 21.19 7.74 20.2 7.05L14.02 2.72C12.62 1.74 10.37 1.79 9.02 2.84Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M8.90002 7.56023C9.21002 3.96023 11.06 2.49023 15.11 2.49023H15.24C19.71 2.49023 21.5 4.28023 21.5 8.75023V15.2702C21.5 19.7402 19.71 21.5302 15.24 21.5302H15.11C11.09 21.5302 9.24002 20.0802 8.91002 16.5402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.85 8.65039L2.5 12.0004L5.85 15.3504" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Feature Page Icons
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M9 17V11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RecordsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DonorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M10.49 2.23L5.49999 4.11C4.34999 4.54 3.40999 5.9 3.40999 7.12V14.55C3.40999 15.73 4.18999 17.28 5.13999 17.99L9.43999 21.2C10.85 22.26 13.17 22.26 14.58 21.2L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12C20.61 5.89 19.67 4.53 18.52 4.1L13.53 2.23C12.68 1.92 11.32 1.92 10.49 2.23Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12.5C13.1046 12.5 14 11.6046 14 10.5C14 9.39543 13.1046 8.5 12 8.5C10.8954 8.5 10 9.39543 10 10.5C10 11.6046 10.8954 12.5 12 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const QueueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M9.16 10.87C9.06 10.86 8.94 10.86 8.83 10.87C6.45 10.79 4.56 8.84 4.56 6.44C4.56 3.99 6.54 2 9 2C11.45 2 13.44 3.99 13.44 6.44C13.43 8.84 11.54 10.79 9.16 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.41 4C18.35 4 19.91 5.57 19.91 7.5C19.91 9.39 18.41 10.93 16.54 11C16.46 10.99 16.37 10.99 16.28 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.16 14.56C1.74 16.18 1.74 18.82 4.16 20.43C6.91 22.27 11.42 22.27 14.17 20.43C16.59 18.81 16.59 16.17 14.17 14.56C11.43 12.73 6.92 12.73 4.16 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.34 20C19.06 19.85 19.74 19.56 20.3 19.13C21.86 17.96 21.86 16.03 20.3 14.86C19.75 14.44 19.08 14.16 18.37 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ApprovalsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const OrganIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16">
    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5.34V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Background Component
const FeatureBackground = ({ isDoctor = false }: { isDoctor?: boolean }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full ${
      isDoctor 
        ? 'bg-gradient-to-br from-teal-400/10 to-cyan-400/5' 
        : 'bg-gradient-to-br from-primary-400/10 to-teal-400/5'
    } blur-[100px]`} />
    <div className={`absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full ${
      isDoctor 
        ? 'bg-gradient-to-br from-primary-400/10 to-violet-400/5' 
        : 'bg-gradient-to-br from-teal-400/10 to-cyan-400/5'
    } blur-[100px]`} />
    <div className="absolute inset-0 opacity-[0.015]" style={{
      backgroundImage: `linear-gradient(rgba(${isDoctor ? '4, 200, 177' : '51, 97, 255'}, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(${isDoctor ? '4, 200, 177' : '51, 97, 255'}, 0.5) 1px, transparent 1px)`,
      backgroundSize: '50px 50px'
    }} />
  </div>
)

// Breadcrumb Component
const Breadcrumb = ({ items }: { items: { label: string; path?: string }[] }) => {
  const navigate = useNavigate()
  
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRightIcon />}
          {item.path ? (
            <button 
              onClick={() => navigate(item.path!)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
            >
              {index === 0 && <HomeIcon />}
              <span>{item.label}</span>
            </button>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

interface FeaturePageProps {
  title: string
  description: string
  backTo: string
  icon: React.ReactNode
  gradient: string
  features: string[]
  actionLabel?: string
}

function FeaturePage({ title, description, backTo, icon, gradient, features, actionLabel }: FeaturePageProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const isDoctor = backTo.includes('doctor')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const breadcrumbItems = isDoctor 
    ? [
        { label: 'Dashboard', path: '/doctor' },
        { label: title }
      ]
    : [
        { label: 'Dashboard', path: '/patient' },
        { label: title }
      ]

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <FeatureBackground isDoctor={isDoctor} />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${
                isDoctor 
                  ? 'bg-gradient-to-br from-teal-600 to-cyan-500 shadow-teal-500/20' 
                  : 'bg-gradient-to-br from-primary-600 to-teal-500 shadow-primary-500/20'
              } flex items-center justify-center shadow-lg`}>
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                  <path d="M8.5 14.25C8.5 16.17 10.07 18.75 12 18.75C13.93 18.75 15.5 16.17 15.5 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.81 2H15.18C16.99 2 17.65 3.03 17.65 4.49V5.39C17.65 6.86 16.99 7.88 15.18 7.88H8.81C7.01 7.88 6.34998 6.86 6.34998 5.39V4.49C6.34998 3.03 7.01 2 8.81 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 7.89001V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.5 7.89001V14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18.75V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-300"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">{isDoctor ? 'Disconnect' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button & Breadcrumb */}
        <div className={`flex flex-col sm:flex-row sm:items-center gap-4 mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => navigate(backTo)}
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-300 self-start ${
              isDoctor ? 'hover:text-teal-700' : 'hover:text-primary-700'
            }`}
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-300">
              <BackIcon />
            </span>
            <span className="font-medium">Back</span>
          </button>
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Feature Card */}
        <div className={`bg-white rounded-3xl shadow-elevated border border-slate-100 overflow-hidden transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Header Section */}
          <div className="px-6 sm:px-10 py-8 sm:py-10 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                {icon}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
                  {title}
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section - Empty State */}
          <div className="px-6 sm:px-10 py-16 sm:py-20">
            <div className="max-w-lg mx-auto text-center">
              {/* Decorative Icon */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-3xl transform rotate-6`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 rounded-3xl transform -rotate-3`} />
                <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-300">
                  {icon}
                </div>
              </div>

              <h2 className="text-xl font-display font-semibold text-slate-700 mb-3">
                Feature Coming Soon
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                This feature is currently under development. Connect with our blockchain infrastructure to enable secure, decentralized data management.
              </p>

              {/* Feature List */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 mb-8 text-left">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
                  What you'll be able to do:
                </h3>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-600">
                      <span className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                          <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                disabled
                className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${gradient} text-white rounded-xl font-semibold shadow-lg opacity-50 cursor-not-allowed`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.9946 16H12.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {actionLabel || 'Integration Pending'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Patient Feature Pages
export function UploadRecord() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [reportType, setReportType] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [facility, setFacility] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { logout } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 10MB')
        return
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Only PDF, JPG, and PNG files are allowed')
        return
      }
      
      setFile(selectedFile)
      setError('')
    }
  }


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (!file || !reportType || !reportDate || !facility) {
    setError('Please fill in all required fields')
    return
  }

  setLoading(true)
  setError('')
  
  try {
    // Step 1: Extract text using ML service OCR
    let extractedText = ''
    try {
      const ocrResult = await extractTextFromReport(file)
      extractedText = ocrResult.text || ''
    } catch (ocrError) {
      console.warn('OCR extraction failed:', ocrError)
      extractedText = 'OCR extraction failed - manual review required'
    }

    // Step 2: Prepare form data with extracted text
    const formData = new FormData()
    formData.append('file', file)
    formData.append('report_type', reportType)
    formData.append('report_date', reportDate)
    formData.append('facility', facility)
    formData.append('extracted_text', extractedText)
    if (symptoms) {
      formData.append('symptoms', symptoms)
    }

    // Step 3: Get Supabase session token
    const { supabase } = await import('./supabaseClient')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Please login to upload records')
    }

    // Step 4: Upload to backend (which handles IPFS + Supabase)
    const response = await fetch(`${BACKEND_API_URL}/api/patient/upload-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `Failed to upload report (${response.status})`)
    }

    await response.json()
    setSuccess(true)
    setError('')
    
    setTimeout(() => {
      navigate('/patient')
    }, 2000)

  } catch (err: any) {
    setError(err.message || 'Failed to upload report')
  } finally {
    setLoading(false)
  }
}

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <FeatureBackground />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-teal-500 shadow-primary-500/20 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                  <path d="M8.5 14.25C8.5 16.17 10.07 18.75 12 18.75C13.93 18.75 15.5 16.17 15.5 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.81 2H15.18C16.99 2 17.65 3.03 17.65 4.49V5.39C17.65 6.86 16.99 7.88 15.18 7.88H8.81C7.01 7.88 6.34998 6.86 6.34998 5.39V4.49C6.34998 3.03 7.01 2 8.81 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => navigate('/patient')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <BackIcon />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-teal-500 px-6 sm:px-10 py-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <UploadIcon />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  Upload Medical Record
                </h1>
                <p className="text-white/90 text-lg">
                  Upload and encrypt your medical records on IPFS. Pending doctor approval.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
                ✅ Report uploaded successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Medical Report File *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="mt-2 text-sm text-slate-500">
                  Accepted formats: PDF, JPG, PNG (Max 10MB)
                </p>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Report Type *
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select report type</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="xray">X-Ray</option>
                  <option value="mri">MRI Scan</option>
                  <option value="ct_scan">CT Scan</option>
                  <option value="blood_test">Blood Test</option>
                  <option value="prescription">Prescription</option>
                  <option value="consultation">Consultation Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Report Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Medical Facility *
                </label>
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="Hospital or clinic name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Symptoms (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Symptoms (Optional)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe any symptoms related to this report..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Report'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export function MyRecords() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [reports, setReports] = useState<any>({ pending_reports: [], verified_reports: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [selectedRecordForView, setSelectedRecordForView] = useState<any>(null)
  const [loadingExtractedText, setLoadingExtractedText] = useState(false)

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'

  useEffect(() => {
    setIsVisible(true)
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const { supabase } = await import('./supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Please log in to view your reports')
        return
      }

      const response = await fetch(`${BACKEND_API_URL}/api/patient/reports`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleViewExtractedText = async (record: any) => {
    setLoadingExtractedText(true)
    try {
      // Fetch the full report details from database to get extracted_text
      const { supabase } = await import('./supabaseClient')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Please log in to view report details')
        return
      }

      const response = await fetch(`${BACKEND_API_URL}/api/patient/reports`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch report details')
      }
      
      const data = await response.json()
      
      // Find matching report by IPFS CID
      const matchingReport = [...(data.verified_reports || []), ...(data.pending_reports || [])].find(
        (r: any) => r.ipfs_cid === record.ipfs_cid
      )
      
      if (matchingReport && matchingReport.extracted_text) {
        setSelectedRecordForView({
          ...record,
          extracted_text: matchingReport.extracted_text,
          report_date: record.issued_date ? new Date(record.issued_date * 1000).toLocaleDateString() : 'Unknown'
        })
      } else {
        alert('No extracted text available for this report')
      }
    } catch (error) {
      console.error('Error fetching extracted text:', error)
      alert('Failed to load report text')
    } finally {
      setLoadingExtractedText(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <FeatureBackground />
      
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-primary-500/20 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                  <path d="M8.5 14.25C8.5 16.17 10.07 18.75 12 18.75C13.93 18.75 15.5 16.17 15.5 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => navigate('/patient')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <BackIcon />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 sm:px-10 py-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <RecordsIcon />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  My Medical Records
                </h1>
                <p className="text-white/90 text-lg">
                  View all your uploaded reports with IPFS storage.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600">Loading reports...</p>
              </div>
            ) : (
              <>
                {/* Pending Reports */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Pending Approval ({reports.total_pending || 0})</h2>
                  {reports.pending_reports?.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No pending reports</p>
                  ) : (
                    <div className="space-y-4">
                      {reports.pending_reports?.map((report: any) => (
                        <div key={report.id} className="border border-slate-200 rounded-xl p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {report.report_type?.replace(/-/g, ' ').toUpperCase()}
                              </h3>
                              <p className="text-sm text-slate-600">Uploaded: {new Date(report.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div><span className="text-slate-500">Date:</span> <span className="text-slate-900">{report.report_date}</span></div>
                            <div><span className="text-slate-500">Facility:</span> <span className="text-slate-900">{report.facility}</span></div>
                          </div>

                          {report.ipfs_gateway_url && (
                            <a
                              href={report.ipfs_gateway_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View on IPFS
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified Reports */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Blockchain Verified Records ({reports.total_verified || 0})
                  </h2>
                  {reports.verified_reports?.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-slate-500 text-lg mb-2">No verified reports yet</p>
                      <p className="text-slate-400 text-sm">Reports will appear here after doctor approval and blockchain verification</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.verified_reports?.map((record: any, idx: number) => (
                        <div key={idx} className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">
                                  {record.report_type?.replace(/-/g, ' ').toUpperCase()}
                                </h3>
                                <p className="text-sm text-slate-600 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Verified on blockchain
                                </p>
                              </div>
                            </div>
                            <span className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold shadow-md flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">📅 Issued Date:</span>
                              <span className="text-slate-900">{new Date(record.issued_date * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">✅ Approved:</span>
                              <span className="text-slate-900">{new Date(record.approved_at * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">🏥 Facility:</span>
                              <span className="text-slate-900">{record.issuing_facility || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">👨‍⚕️ Verified By:</span>
                              <span className="text-slate-900 font-mono text-xs">DR-{record.issued_by?.slice(2, 10).toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4 mb-4 border border-green-100">
                            <div className="text-xs text-slate-500 mb-1 font-medium">Document Hash</div>
                            <div className="font-mono text-xs text-slate-700 break-all bg-slate-50 p-2 rounded">{record.document_hash}</div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleViewExtractedText(record)}
                              disabled={loadingExtractedText}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingExtractedText ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                              View Report
                            </button>
                            
                            {record.tx_hash ? (
                              <a
                                href={`https://amoy.polygonscan.com/tx/${record.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                View on Blockchain
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                No Transaction Hash
                              </div>
                            )}
                            
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(record.ipfs_cid)
                                alert('IPFS CID copied to clipboard!')
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy IPFS CID
                            </button>
                          </div>
                          
                          {record.is_doctor_verified && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Doctor Verified & Blockchain Secured</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal for viewing extracted text */}
      {selectedRecordForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedRecordForView(null)}
            />
            <div className="relative inline-block align-bottom bg-white rounded-xl shadow-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Extracted Report Text
                </h3>
                <button
                  onClick={() => setSelectedRecordForView(null)}
                  className="text-white hover:text-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Patient:</strong> Unknown
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Report Type:</strong> {selectedRecordForView.report_type?.replace('_', ' ').replace(/-/g, ' ').toUpperCase()}
                  </p>
                  {selectedRecordForView.report_date && (
                    <p className="text-sm text-slate-600 mb-4">
                      <strong>Date:</strong> {selectedRecordForView.report_date}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {selectedRecordForView.extracted_text}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                <a
                  href={selectedRecordForView.ipfs_gateway_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-primary-600 shadow-sm px-4 py-2 text-base font-medium text-white hover:bg-primary-700 sm:w-auto sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open on IPFS
                </a>
                <button
                  onClick={() => setSelectedRecordForView(null)}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function RegisterDonor() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bloodType: '',
    organs: [] as string[],
    age: '',
    tissueTypeHLA: '',
    medicalHistory: '',
  })
  const [certificate, setCertificate] = useState<File | null>(null)

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const availableOrgans = [
    'kidney',
    'liver',
    'heart',
    'lung',
    'pancreas',
    'cornea',
  ]

  const handleOrganToggle = (organ: string) => {
    setFormData(prev => ({
      ...prev,
      organs: prev.organs.includes(organ)
        ? prev.organs.filter(o => o !== organ)
        : [...prev.organs, organ],
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCertificate(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user?.id) {
        throw new Error('User not logged in')
      }

      if (!formData.bloodType) {
        throw new Error('Please select a blood type')
      }

      if (formData.organs.length === 0) {
        throw new Error('Please select at least one organ to donate')
      }

      if (!certificate) {
        throw new Error('Please upload a medical clearance certificate')
      }

      // Use patient's Supabase UUID directly - no wallet address needed!
      const patientId = user.id

      const submitFormData = new FormData()
      submitFormData.append('patient_id', patientId)
      submitFormData.append('blood_type', formData.bloodType)
      submitFormData.append('organ_type', formData.organs.join(', '))
      submitFormData.append('age', formData.age)
      if (formData.tissueTypeHLA) {
        submitFormData.append('tissue_type_hla', formData.tissueTypeHLA)
      }
      if (formData.medicalHistory) {
        submitFormData.append('encrypted_medical_history', formData.medicalHistory)
      }
      submitFormData.append('medical_certificate', certificate)

      const response = await fetch('http://localhost:8000/api/organ-donor/register', {
        method: 'POST',
        body: submitFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed')
      }

      alert('✅ Registration successful! You are now registered as an organ donor. Your medical certificate has been securely stored on IPFS.')
      navigate('/patient')
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(`❌ Registration failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/patient')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl text-white">
              <DonorIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Register as Organ Donor
              </h1>
              <p className="text-gray-600 mt-1">
                Join the life-saving organ donor registry
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blood Type *
              </label>
              <select
                required
                value={formData.bloodType}
                onChange={e =>
                  setFormData({ ...formData, bloodType: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Select your blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Organs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Organs to Donate * (select at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableOrgans.map(organ => (
                  <button
                    key={organ}
                    type="button"
                    onClick={() => handleOrganToggle(organ)}
                    className={`px-4 py-3 rounded-xl border-2 transition-all ${
                      formData.organs.includes(organ)
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold'
                        : 'border-gray-300 hover:border-rose-300'
                    }`}
                  >
                    {organ.charAt(0).toUpperCase() + organ.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age * (18-75)
              </label>
              <input
                type="number"
                required
                min="18"
                max="75"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Enter your age"
              />
            </div>

            {/* HLA Tissue Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                HLA Tissue Type (Optional)
              </label>
              <input
                type="text"
                value={formData.tissueTypeHLA}
                onChange={e =>
                  setFormData({ ...formData, tissueTypeHLA: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="e.g., A*02:01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Improves compatibility matching for transplants
              </p>
            </div>

            {/* Medical History */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical History (Optional)
              </label>
              <textarea
                value={formData.medicalHistory}
                onChange={e =>
                  setFormData({ ...formData, medicalHistory: e.target.value })
                }
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Any relevant medical conditions or history..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.medicalHistory.length}/500 characters
              </p>
            </div>

            {/* Medical Certificate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical Clearance Certificate *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-700 file:font-semibold hover:file:bg-rose-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload medical clearance from a licensed physician (PDF, JPG, PNG)
              </p>
            </div>

            {/* Consent */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> By registering as an organ donor, you
                authorize medical professionals to access your donor information
                for life-saving transplant matching purposes. This registration is
                recorded on the blockchain and can be updated or revoked at any
                time.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Just a minute...' : 'Get Approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export function AccessControl() {
  return (
    <FeaturePage 
      title="Access Control" 
      description="Manage who can access your medical records with fine-grained permissions. Grant time-limited access to doctors and specialists."
      backTo="/patient"
      icon={<AccessIcon />}
      gradient="from-violet-500 to-violet-600"
      features={[
        "View all active access permissions",
        "Grant access to specific doctors or hospitals",
        "Set expiry dates for temporary access",
        "Instantly revoke access with one click"
      ]}
      actionLabel="Manage Access"
    />
  )
}

// Doctor Feature Pages
export function PatientQueue() {
  return (
    <FeaturePage 
      title="Patient Queue" 
      description="View and manage patients who have granted you access to their medical records. Efficient queue management for your practice."
      backTo="/doctor"
      icon={<QueueIcon />}
      gradient="from-primary-500 to-primary-600"
      features={[
        "View patients waiting for consultation",
        "Access granted medical records",
        "Add consultation notes to records",
        "Manage appointment scheduling"
      ]}
      actionLabel="View Queue"
    />
  )
}

export function PendingApprovals() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [selectedReportForView, setSelectedReportForView] = useState<any | null>(null)
  const [txStatus, setTxStatus] = useState<string>('')

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'

  useEffect(() => {
    setIsVisible(true)
    fetchPendingReports()
  }, [])

  const fetchPendingReports = async () => {
    try {
      setLoading(true)
      const mockDoctorToken = localStorage.getItem('doctor_token') || 'mock_doctor_token'
      
      const response = await fetch(`${BACKEND_API_URL}/api/doctor/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${mockDoctorToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending reports')
      }

      const data = await response.json()
      setReports(data.pending_reports || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reportId: string) => {
    try {
      setApprovingId(reportId)
      setTxStatus('Preparing approval...')
      const mockDoctorToken = localStorage.getItem('doctor_token') || 'mock_doctor_token'
      
      // Step 1: Get blockchain data from backend
      const response = await fetch(`${BACKEND_API_URL}/api/doctor/approve-report/${reportId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockDoctorToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to prepare approval')
      }

      const data = await response.json()
      const { blockchain_data } = data

      // Step 2: Connect to MetaMask and get contract
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.')
      }

      setTxStatus('Connecting to wallet...')
      
      // Get the currently connected wallet from MetaMask directly
      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const connectedWallet = (await signer.getAddress()).toLowerCase()
      
      const expectedDoctorWallet = '0xeb1dd2bc587b1c0801be9b14987aaf93897f4c30'.toLowerCase()
      
      console.log('🔍 Wallet check:', {
        connected: connectedWallet,
        expected: expectedDoctorWallet,
        match: connectedWallet === expectedDoctorWallet
      })
      
      // Verify doctor is using the correct wallet
      if (connectedWallet !== expectedDoctorWallet) {
        throw new Error(`Please connect with the doctor wallet:\n${expectedDoctorWallet}\n\nCurrently connected:\n${connectedWallet}\n\nPlease switch your MetaMask account.`)
      }
      
      console.log('✅ Correct doctor wallet connected')

      // Get contract with network verification
      setTxStatus('Connecting to Polygon Amoy...')
      toast.loading('Connecting to Polygon Amoy...', { id: 'tx-toast' })
      
      const { getContract } = await import('./utils/metamask')
      const contract = await getContract()
      
      // Check if doctor is registered in the contract
      const { ethers } = await import('ethers')
      const doctorAddress = ethers.getAddress(connectedWallet)
      
      try {
        const doctorInfo = await contract.users(doctorAddress)
        console.log('👤 Wallet info:', {
          address: doctorAddress,
          role: doctorInfo.role.toString(),
          isActive: doctorInfo.isActive,
          license: doctorInfo.licenseNumber
        })
        
        if (!doctorInfo || doctorInfo.role !== 2n) { // Role.Doctor = 2 (as BigInt)
          throw new Error(`Doctor wallet ${doctorAddress} is not registered as a doctor in the smart contract.\n\nCurrent role: ${doctorInfo.role.toString()}\nExpected: 2 (Doctor)\n\nPlease contact admin to register this wallet as a doctor.`)
        }
        if (!doctorInfo.isActive) {
          throw new Error(`Doctor wallet is registered but not active. Please contact admin.`)
        }
        console.log('✅ Doctor verified:', doctorAddress)
      } catch (error: any) {
        if (error.message.includes('not registered') || error.message.includes('Current role')) {
          throw error
        }
        // If we can't read the contract, continue anyway (might be a network issue)
        console.warn('⚠️ Could not verify doctor registration:', error.message)
      }
      
      console.log('✅ Connected to contract:', contract.target)
      console.log('📝 Blockchain data:', blockchain_data)
      
      // Step 3: Call smart contract submitMedicalRecord
      setTxStatus('Please confirm transaction in MetaMask...')
      toast.loading('Please confirm transaction in MetaMask...', { id: 'tx-toast' })
      
      // Prepare parameters
      const issuedTimestamp = Math.floor(new Date(blockchain_data.reportDate || Date.now()).getTime() / 1000)
      const metadata = JSON.stringify({ 
        approved_by: 'doctor', 
        timestamp: Date.now(),
        report_id: reportId 
      })
      
      // Convert patient address to checksum format to avoid ENS resolution (ethers already imported above)
      const checksummedPatientAddress = ethers.getAddress(blockchain_data.patientAddress)
      
      console.log('📤 Calling submitMedicalRecord with:', {
        documentHash: blockchain_data.documentHash,
        ipfsCID: blockchain_data.ipfsCID,
        reportType: blockchain_data.reportType,
        facility: blockchain_data.issuingFacility || 'Unknown',
        patientAddress: checksummedPatientAddress,
        issuedDate: issuedTimestamp,
        metadata: metadata
      })
      
      const tx = await contract.submitMedicalRecord(
        blockchain_data.documentHash,
        blockchain_data.ipfsCID,
        blockchain_data.reportType,
        blockchain_data.issuingFacility || 'Unknown',
        checksummedPatientAddress,
        issuedTimestamp,
        metadata
      )
      
      console.log('🔄 Transaction sent:', tx.hash)

      setTxStatus(`Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`)
      toast.loading(`Transaction submitted! Waiting for confirmation...`, { id: 'tx-toast' })
      
      const receipt = await tx.wait()
      
      console.log('✅ Transaction confirmed:', receipt)
      
      toast.success('Transaction confirmed on blockchain!', { id: 'tx-toast' })
      setTxStatus('Transaction confirmed! Updating database...')

      // Step 4: Confirm with backend
      const confirmResponse = await fetch(`${BACKEND_API_URL}/api/doctor/confirm-approval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockDoctorToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          report_id: reportId,
          tx_hash: receipt.hash,
          document_hash: blockchain_data.documentHash,
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm approval in database')
      }

      // Refresh the list
      await fetchPendingReports()
      setTxStatus('')
      toast.success('Report approved and recorded on blockchain!', { id: 'tx-toast' })
    } catch (err: any) {
      console.error('Approval error:', err)
      
      // Handle specific error cases
      if (err.message?.includes('Record already exists')) {
        toast.error('This report has already been approved and recorded on the blockchain.', { id: 'tx-toast' })
        // Refresh to remove it from pending list
        await fetchPendingReports()
      } else if (err.message?.includes('Only doctors allowed')) {
        toast.error('Please connect with a registered doctor wallet to approve reports.', { id: 'tx-toast' })
      } else if (err.message?.includes('Please connect with the doctor wallet')) {
        toast.error(err.message, { id: 'tx-toast', duration: 7000 })
      } else {
        toast.error(err.message || 'Failed to approve report', { id: 'tx-toast' })
      }
      
      setTxStatus('')
    } finally {
      setApprovingId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Add Toaster component for toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      
      <FeatureBackground isDoctor />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 shadow-teal-500/20 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                  <path d="M8.5 14.25C8.5 16.17 10.07 18.75 12 18.75C13.93 18.75 15.5 16.17 15.5 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.81 2H15.18C16.99 2 17.65 3.03 17.65 4.49V5.39C17.65 6.86 16.99 7.88 15.18 7.88H8.81C7.01 7.88 6.34998 6.86 6.34998 5.39V4.49C6.34998 3.03 7.01 2 8.81 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <button onClick={() => navigate('/doctor')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <BackIcon />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 sm:px-10 py-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <ApprovalsIcon />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  Pending Approvals
                </h1>
                <p className="text-white/90 text-lg">
                  Review and approve patient medical reports awaiting verification.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                ⚠️ {error}
              </div>
            )}

            {/* Transaction Status Banner */}
            {txStatus && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium">{txStatus}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <ApprovalsIcon />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Pending Reports</h3>
                <p className="text-slate-500">All patient reports have been reviewed and approved.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {report.report_type?.replace('_', ' ').replace(/-/g, ' ').toUpperCase()}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Patient: {report.patient_name || 'Unknown'} ({report.patient_email || report.patient_id?.substring(0, 8) + '...'})
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-slate-500">Date:</span>
                        <span className="ml-2 text-slate-900">{report.report_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Facility:</span>
                        <span className="ml-2 text-slate-900">{report.facility || 'N/A'}</span>
                      </div>
                      {report.risk_level && (
                        <div>
                          <span className="text-slate-500">Risk:</span>
                          <span className="ml-2 text-slate-900 capitalize">{report.risk_level}</span>
                        </div>
                      )}
                    </div>

                    {report.ai_summary && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-700">
                          <strong>AI Analysis:</strong> {report.ai_summary}
                        </p>
                      </div>
                    )}

                    {report.symptoms && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-600">
                          <strong>Symptoms:</strong> {report.symptoms}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {report.extracted_text && (
                        <button
                          onClick={() => setSelectedReportForView(report)}
                          className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Report
                        </button>
                      )}
                      <button
                        onClick={() => handleApprove(report.id)}
                        disabled={approvingId !== null}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {approvingId === report.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          'Approve Report'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal for viewing extracted text */}
      {selectedReportForView && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setSelectedReportForView(null)}
            />
            <div className="relative inline-block align-bottom bg-white rounded-xl shadow-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Extracted Report Text
                </h3>
                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="text-white hover:text-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                <div className="mb-4">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Patient:</strong> {selectedReportForView.patient_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Report Type:</strong> {selectedReportForView.report_type?.replace('_', ' ').replace(/-/g, ' ').toUpperCase()}
                  </p>
                  {selectedReportForView.report_date && (
                    <p className="text-sm text-slate-600 mb-4">
                      <strong>Date:</strong> {selectedReportForView.report_date}
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {selectedReportForView.extracted_text}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={() => setSelectedReportForView(null)}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const report = selectedReportForView
                    setSelectedReportForView(null)
                    handleApprove(report.id)
                  }}
                  disabled={approvingId !== null}
                  className="w-full inline-flex justify-center rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 shadow-sm px-4 py-2 text-base font-medium text-white hover:shadow-lg sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Approve Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function OrganDonations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [donors, setDonors] = useState<any[]>([])
  const [filters, setFilters] = useState({
    organType: '',
    bloodType: '',
    minAge: '18',
    maxAge: '75',
  })
  const [selectedDonor, setSelectedDonor] = useState<any>(null)

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const organTypes = ['kidney', 'liver', 'heart', 'lung', 'pancreas', 'cornea']

  const handleSearch = async () => {
    if (!filters.organType) {
      alert('Please select an organ type')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        organ_type: filters.organType,
        ...(filters.bloodType && { blood_type: filters.bloodType }),
        min_age: filters.minAge,
        max_age: filters.maxAge,
      })

      const response = await fetch(
        `http://localhost:8000/api/organ-donor/search?${params}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Search failed')
      }

      setDonors(data.donors || [])
      setSearchPerformed(true)
    } catch (error: any) {
      console.error('Search error:', error)
      alert(`❌ Search failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/doctor')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl text-white">
              <OrganIcon />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Organ Donor Registry
              </h1>
              <p className="text-gray-600 mt-1">
                Search for compatible organ donors
              </p>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Search Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Organ Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organ Type *
              </label>
              <select
                value={filters.organType}
                onChange={e =>
                  setFilters({ ...filters, organType: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Select organ</option>
                {organTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blood Type (Optional)
              </label>
              <select
                value={filters.bloodType}
                onChange={e =>
                  setFilters({ ...filters, bloodType: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Any</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min Age
              </label>
              <input
                type="number"
                min="18"
                max="75"
                value={filters.minAge}
                onChange={e => setFilters({ ...filters, minAge: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>

            {/* Max Age */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Age
              </label>
              <input
                type="number"
                min="18"
                max="75"
                value={filters.maxAge}
                onChange={e => setFilters({ ...filters, maxAge: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-6 w-full md:w-auto px-8 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search Donors'}
          </button>
        </div>

        {/* Results */}
        {searchPerformed && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Search Results ({donors.length} donors found)
            </h2>

            {donors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No compatible donors found</p>
                <p className="text-sm mt-2">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donors.map((donor, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-rose-300 transition-all cursor-pointer"
                    onClick={() => setSelectedDonor(donor)}
                  >
                    {/* Compatibility Score */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-600">
                        Match Score
                      </span>
                      <span
                        className={`text-2xl font-bold ${
                          donor.compatibility_score >= 80
                            ? 'text-green-600'
                            : donor.compatibility_score >= 60
                            ? 'text-yellow-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {donor.compatibility_score}%
                      </span>
                    </div>

                    {/* Donor Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Type:</span>
                        <span className="font-semibold">{donor.blood_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-semibold">{donor.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Organs:</span>
                        <span className="font-semibold text-xs">
                          {donor.organ_type}
                        </span>
                      </div>
                      {donor.tissue_type_hla && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">HLA:</span>
                          <span className="font-semibold text-xs">
                            {donor.tissue_type_hla}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* View Certificate Button */}
                    {donor.ipfs_url && (
                      <a
                        href={donor.ipfs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg"
                      >
                        📄 View Certificate on IPFS
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Donor Detail Modal */}
        {selectedDonor && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDonor(null)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Donor Details
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Compatibility Score</span>
                  <span className="text-3xl font-bold text-rose-600">
                    {selectedDonor.compatibility_score}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Blood Type</p>
                    <p className="font-semibold text-lg">
                      {selectedDonor.blood_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-semibold text-lg">{selectedDonor.age}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Available Organs</p>
                    <p className="font-semibold">{selectedDonor.organ_type}</p>
                  </div>
                  {selectedDonor.tissue_type_hla && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">HLA Tissue Type</p>
                      <p className="font-semibold">
                        {selectedDonor.tissue_type_hla}
                      </p>
                    </div>
                  )}
                  {selectedDonor.ipfs_url && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Medical Certificate
                      </p>
                      <a
                        href={selectedDonor.ipfs_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        📄 View Certificate on IPFS →
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedDonor(null)}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}