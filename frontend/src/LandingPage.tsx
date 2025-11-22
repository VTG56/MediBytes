import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Premium SVG Icons
const PatientIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DoctorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M18 18.86H17.24C16.44 18.86 15.68 19.17 15.12 19.73L13.41 21.42C12.63 22.19 11.36 22.19 10.58 21.42L8.87 19.73C8.31 19.17 7.54 18.86 6.75 18.86H6C4.34 18.86 3 17.53 3 15.89V4.97C3 3.33 4.34 2 6 2H18C19.66 2 21 3.33 21 4.97V15.88C21 17.52 19.66 18.86 18 18.86Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 10C13.2868 10 14.33 8.95681 14.33 7.67C14.33 6.38319 13.2868 5.34 12 5.34C10.7132 5.34 9.67001 6.38319 9.67001 7.67C9.67001 8.95681 10.7132 10 12 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 15.66C16 13.86 14.21 12.4 12 12.4C9.79 12.4 8 13.86 8 15.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M10.49 2.23L5.49999 4.11C4.34999 4.54 3.40999 5.9 3.40999 7.12V14.55C3.40999 15.73 4.18999 17.28 5.13999 17.99L9.43999 21.2C10.85 22.26 13.17 22.26 14.58 21.2L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12C20.61 5.89 19.67 4.53 18.52 4.1L13.53 2.23C12.68 1.92 11.32 1.92 10.49 2.23Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12.5C13.1046 12.5 14 11.6046 14 10.5C14 9.39543 13.1046 8.5 12 8.5C10.8954 8.5 10 9.39543 10 10.5C10 11.6046 10.8954 12.5 12 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BlockchainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M3.5 18V7C3.5 3 4.5 2 8.5 2H15.5C19.5 2 20.5 3 20.5 7V17C20.5 17.14 20.5 17.28 20.49 17.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.35 15H20.5V18.5C20.5 20.43 18.93 22 17 22H7C5.07 22 3.5 20.43 3.5 18.5V17.85C3.5 16.28 4.78 15 6.35 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 10.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DecentralizedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.99998 3H8.99998C7.04998 8.84 7.04998 15.16 8.99998 21H7.99998" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 3C16.95 8.84 16.95 15.16 15 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 16V15C8.84 16.95 15.16 16.95 21 15V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 9.0001C8.84 7.0501 15.16 7.0501 21 9.0001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M14.43 5.93L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Animated Background Particles
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary-400/30 to-teal-400/20 blur-[80px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-teal-400/25 to-cyan-400/15 blur-[80px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-5%] left-[30%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-primary-500/20 to-violet-400/15 blur-[80px] animate-blob animation-delay-4000" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(rgba(51, 97, 255, 0.5) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(51, 97, 255, 0.5) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
    </div>
  )
}

// Feature Badge Component
const FeatureBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/50 shadow-sm">
    <span className="text-primary-600">{icon}</span>
    <span className="text-sm font-medium text-slate-700">{text}</span>
  </div>
)

export default function LandingPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    { icon: <ShieldIcon />, text: 'End-to-end Encryption' },
    { icon: <BlockchainIcon />, text: 'Blockchain Secured' },
    { icon: <DecentralizedIcon />, text: 'Decentralized Storage' },
    { icon: <HeartIcon />, text: 'Organ Donor Registry' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise" />
      
      {/* Navigation */}
      <nav className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                <img src="/assets/logo1.png" alt="MediBytes Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-6xl md:text-7xl p-2 font-display font-bold bg-gradient-to-r from-primary-600 via-teal-600 to-primary-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                MediBytes
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-teal-50 rounded-full border border-primary-100/50 mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-lg font-medium text-primary-700">Revolutionizing Healthcare Data</span>
          </div>

          {/* Main Heading */}
          <h1 className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Your Health Data,{' '}
            <span className="relative">
              <span className="gradient-text">Secured Forever</span>
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-teal-400/30" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
            {' '}on the Blockchain
          </h1>

          {/* Subheading */}
          <p className={`text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            MediBytes empowers patients and healthcare providers with a decentralized platform for managing medical records, organ donations, and health data with advanced encryption.
          </p>

          {/* Feature Badges */}
          <div className={`flex flex-wrap justify-center gap-3 mb-12 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {features.map((feature, index) => (
              <FeatureBadge key={index} icon={feature.icon} text={feature.text} />
            ))}
          </div>
        </div>

        {/* Portal Cards */}
        <div className={`grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Patient Portal Card */}
          <button
            onClick={() => navigate('/auth?role=patient')}
            className="group relative bg-white rounded-3xl p-8 lg:p-10 shadow-card hover:shadow-card-hover transition-all duration-500 border border-slate-100/80 overflow-hidden text-left"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary-400/20 to-teal-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 text-white shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/40 group-hover:scale-105 transition-all duration-300">
                <PatientIcon />
              </div>
              
              {/* Content */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                    Patient Portal
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Securely access and manage your medical records. Control who sees your health data.
                  </p>
                </div>
                <div className="mt-1 p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all duration-300">
                  <ArrowRightIcon />
                </div>
              </div>
              
              {/* Features list */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Upload Records</span>
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Access Control</span>
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Donor Registry</span>
              </div>
            </div>
          </button>

          {/* Doctor Portal Card */}
          <button
            onClick={() => navigate('/auth?role=doctor')}
            className="group relative bg-white rounded-3xl p-8 lg:p-10 shadow-card hover:shadow-card-hover transition-all duration-500 border border-slate-100/80 overflow-hidden text-left"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-teal-400/20 to-cyan-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-6 text-white shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/40 group-hover:scale-105 transition-all duration-300">
                <DoctorIcon />
              </div>
              
              {/* Content */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                    Doctor Portal
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Connect your wallet to manage patients, approve requests, and access medical data.
                  </p>
                </div>
                <div className="mt-1 p-2 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-teal-100 group-hover:text-teal-600 transition-all duration-300">
                  <ArrowRightIcon />
                </div>
              </div>
              
              {/* Features list */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Patient Queue</span>
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Approvals</span>
                <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">Organ Donations</span>
              </div>
            </div>
          </button>
        </div>

        {/* Key Features */}
        <div className={`mt-16 md:mt-20 transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col items-center gap-6">
            {/* Top row - 2 items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 22C17 22 22 17 22 12C22 7 17 2 12 2C7 2 2 7 2 12C2 17 7 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 2V6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 18V22" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 12H6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M18 12H22" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Blockchain Security</h3>
                <p className="text-sm text-slate-600">Immutable records on Polygon network</p>
              </div>
              
              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2.67004 18.95L7.60004 15.64C8.39004 15.11 9.53004 15.17 10.24 15.78L10.57 16.07C11.35 16.74 12.61 16.74 13.39 16.07L17.55 12.5C18.33 11.83 19.59 11.83 20.37 12.5L22 13.9" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">IPFS Storage</h3>
                <p className="text-sm text-slate-600">Decentralized medical record storage</p>
              </div>
            </div>
            
            {/* Bottom row - 1 centered item */}
            <div className="w-full max-w-md">
              <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 6V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M9 12L12 14L15 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 17H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">AI Health Insights</h3>
                <p className="text-sm text-slate-600">ML-powered health predictions & analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>  

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <span className="text-sm text-slate-600">© 2025 MediBytes. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}