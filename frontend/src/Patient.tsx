import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

// Icons
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    <path d="M9 17V11L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RecordsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DonorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HealthInsightsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.9946 16H12.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.75 12L9.25 10.5L11.25 12.5L14.75 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M8.90002 7.56023C9.21002 3.96023 11.06 2.49023 15.11 2.49023H15.24C19.71 2.49023 21.5 4.28023 21.5 8.75023V15.2702C21.5 19.7402 19.71 21.5302 15.24 21.5302H15.11C11.09 21.5302 9.24002 20.0802 8.91002 16.5402" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 12H3.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.85 8.65039L2.5 12.0004L5.85 15.3504" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M14.43 5.93L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)



// Background Component
const DashboardBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary-400/10 to-teal-400/5 blur-[100px]" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-400/10 to-cyan-400/5 blur-[100px]" />
    <div className="absolute inset-0 opacity-[0.015]" style={{
      backgroundImage: `linear-gradient(rgba(51, 97, 255, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(51, 97, 255, 0.5) 1px, transparent 1px)`,
      backgroundSize: '50px 50px'
    }} />
  </div>
)

// Action Card Component
const ActionCard = ({ 
  title, 
  description, 
  icon, 
  gradient, 
  onClick 
}: { 
  title: string; 
  description: string;
  icon: React.ReactNode; 
  gradient: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-500 text-left overflow-hidden"
  >
    {/* Hover gradient overlay */}
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
    
    {/* Glow effect */}
    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
    
    <div className="relative flex items-start gap-4">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-display font-semibold text-slate-900 mb-1 group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="mt-1 p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all duration-300">
        <ArrowRightIcon />
      </div>
    </div>
  </button>
)

export default function Patient() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleNavigate = (path: string, title: string) => {
    toast.success(`Opening ${title}...`)
    setTimeout(() => navigate(path), 500)
  }

  const actions = [
    { 
      title: 'Upload Record', 
      description: 'Upload and encrypt your medical records securely on the blockchain.',
      icon: <UploadIcon />, 
      path: '/patient/upload', 
      gradient: 'from-primary-500 to-primary-600' 
    },
    { 
      title: 'My Records', 
      description: 'View and manage all your encrypted medical records.',
      icon: <RecordsIcon />, 
      path: '/patient/records', 
      gradient: 'from-teal-500 to-teal-600' 
    },
    { 
      title: 'Register as Donor', 
      description: 'Join the organ donor registry and save lives.',
      icon: <DonorIcon />, 
      path: '/patient/donor', 
      gradient: 'from-rose-500 to-rose-600' 
    },
    { 
      title: 'Health Insights', 
      description: 'Get AI-powered analysis of your lab reports.',
      icon: <HealthInsightsIcon />, 
      path: '/patient/health-insights', 
      gradient: 'from-violet-500 to-violet-600' 
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <DashboardBackground />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/20 overflow-hidden">
                <img src="/assets/logo1.png" alt="MediBytes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">
                    {user?.email?.charAt(0).toUpperCase() || 'P'}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-slate-700">{user?.email || 'Patient'}</div>
                  <div className="text-xs text-slate-400">Patient Account</div>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-300"
              >
                <LogoutIcon />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-2">
            Welcome back! 👋
          </h1>
          
        </div>

        {/* Quick Actions - 4 Cards */}
        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => (
              <ActionCard
                key={action.path}
                title={action.title}
                description={action.description}
                icon={action.icon}
                gradient={action.gradient}
                onClick={() => handleNavigate(action.path, action.title)}
              />
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}