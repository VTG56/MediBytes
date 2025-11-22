import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { detectMetaMask, completeWalletConnection } from './utils/metamask'
import toast from 'react-hot-toast'

// Icons (keeping all existing icons)
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M9.57 5.93L3.5 12L9.57 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 12H3.67" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M6 10V8C6 4.69 7 2 12 2C17 2 18 4.69 18 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18.5C13.3807 18.5 14.5 17.3807 14.5 16C14.5 14.6193 13.3807 13.5 12 13.5C10.6193 13.5 9.5 14.6193 9.5 16C9.5 17.3807 10.6193 18.5 12 18.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 22H7C3 22 2 21 2 17V15C2 11 3 10 7 10H17C21 10 22 11 22 15V17C22 21 21 22 17 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M18.04 13.55C17.62 13.96 17.38 14.55 17.44 15.18C17.53 16.26 18.52 17.05 19.6 17.05H21.5V18.24C21.5 20.31 19.81 22 17.74 22H6.26C4.19 22 2.5 20.31 2.5 18.24V11.51C2.5 9.44 4.19 7.75 6.26 7.75H17.74C19.81 7.75 21.5 9.44 21.5 11.51V12.95H19.48C18.92 12.95 18.41 13.17 18.04 13.55Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 12.41V7.84004C2.5 6.65004 3.23 5.59 4.34 5.17L12.28 2.17C13.52 1.7 14.85 2.62003 14.85 3.95003V7.75002" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.5588 13.9702V16.0302C22.5588 16.5802 22.1188 17.0302 21.5588 17.0502H19.5988C18.5188 17.0502 17.5288 16.2602 17.4388 15.1802C17.3788 14.5502 17.6188 13.9602 18.0388 13.5502C18.4088 13.1702 18.9188 12.9502 19.4788 12.9502H21.5588C22.1188 12.9702 22.5588 13.4202 22.5588 13.9702Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MetaMaskIcon = () => (
  <svg viewBox="0 0 32 32" className="w-6 h-6">
    <path fill="#E17726" d="M27.2 4.1L17.8 10.9L19.5 6.8L27.2 4.1Z"/>
    <path fill="#E27625" d="M4.8 4.1L14.1 11L12.5 6.8L4.8 4.1Z"/>
    <path fill="#E27625" d="M23.8 20.7L21.3 24.6L26.6 26L28.1 20.9L23.8 20.7Z"/>
    <path fill="#E27625" d="M3.9 20.9L5.4 26L10.7 24.6L8.2 20.7L3.9 20.9Z"/>
    <path fill="#E27625" d="M10.4 14.1L9 16.1L14.2 16.3L14 10.7L10.4 14.1Z"/>
    <path fill="#E27625" d="M21.6 14.1L17.9 10.6L17.8 16.3L23 16.1L21.6 14.1Z"/>
    <path fill="#E27625" d="M10.7 24.6L13.9 23L11.1 20.9L10.7 24.6Z"/>
    <path fill="#E27625" d="M18.1 23L21.3 24.6L20.9 20.9L18.1 23Z"/>
    <path fill="#D5BFB2" d="M21.3 24.6L18.1 23L18.4 25.7L18.3 26L21.3 24.6Z"/>
    <path fill="#D5BFB2" d="M10.7 24.6L13.7 26L13.6 25.7L13.9 23L10.7 24.6Z"/>
    <path fill="#233447" d="M13.8 19.4L11 18.6L13 17.7L13.8 19.4Z"/>
    <path fill="#233447" d="M18.2 19.4L19 17.7L21 18.6L18.2 19.4Z"/>
    <path fill="#CC6228" d="M10.7 24.6L11.1 20.7L8.2 20.7L10.7 24.6Z"/>
    <path fill="#CC6228" d="M20.9 20.7L21.3 24.6L23.8 20.7L20.9 20.7Z"/>
    <path fill="#CC6228" d="M23 16.1L17.8 16.3L18.2 19.4L19 17.7L21 18.6L23 16.1Z"/>
    <path fill="#CC6228" d="M11 18.6L13 17.7L13.8 19.4L14.2 16.3L9 16.1L11 18.6Z"/>
    <path fill="#E27525" d="M9 16.1L11.1 20.9L11 18.6L9 16.1Z"/>
    <path fill="#E27525" d="M21 18.6L20.9 20.9L23 16.1L21 18.6Z"/>
    <path fill="#E27525" d="M14.2 16.3L13.8 19.4L14.3 22L14.4 17.9L14.2 16.3Z"/>
    <path fill="#E27525" d="M17.8 16.3L17.6 17.9L17.7 22L18.2 19.4L17.8 16.3Z"/>
    <path fill="#F5841F" d="M18.2 19.4L17.7 22L18.1 23L20.9 20.9L21 18.6L18.2 19.4Z"/>
    <path fill="#F5841F" d="M11 18.6L11.1 20.9L13.9 23L14.3 22L13.8 19.4L11 18.6Z"/>
    <path fill="#C0AC9D" d="M18.3 26L18.4 25.7L18.1 25.4V23.7L17.7 22L17.6 17.9L14.4 17.9L14.3 22L13.9 25.4V25.7L14 26L13.7 26L10.7 24.6L11.7 25.4L13.9 27H18.1L20.3 25.4L21.3 24.6L18.3 26Z"/>
    <path fill="#161616" d="M18.1 23L17.7 22H14.3L13.9 23L13.6 25.7L13.9 25.4H18.1L18.4 25.7L18.1 23Z"/>
    <path fill="#763E1A" d="M27.6 11.3L28.5 7.5L27.2 4.1L18.1 10.7L21.6 14.1L26.5 15.6L27.7 14.2L27.1 13.8L28 13L27.3 12.5L28.2 11.8L27.6 11.3Z"/>
    <path fill="#763E1A" d="M3.5 7.5L4.4 11.3L3.8 11.8L4.7 12.5L4 13L4.9 13.8L4.3 14.2L5.5 15.6L10.4 14.1L13.9 10.7L4.8 4.1L3.5 7.5Z"/>
    <path fill="#F5841F" d="M26.5 15.6L21.6 14.1L23 16.1L20.9 20.9L23.8 20.7H28.1L26.5 15.6Z"/>
    <path fill="#F5841F" d="M10.4 14.1L5.5 15.6L3.9 20.7H8.2L11.1 20.9L9 16.1L10.4 14.1Z"/>
    <path fill="#F5841F" d="M17.8 16.3L18.1 10.7L19.5 6.8H12.5L13.9 10.7L14.2 16.3L14.3 17.9L14.3 22H17.7L17.7 17.9L17.8 16.3Z"/>
  </svg>
)

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M10.49 2.23L5.49999 4.11C4.34999 4.54 3.40999 5.9 3.40999 7.12V14.55C3.40999 15.73 4.18999 17.28 5.13999 17.99L9.43999 21.2C10.85 22.26 13.17 22.26 14.58 21.2L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12C20.61 5.89 19.67 4.53 18.52 4.1L13.53 2.23C12.68 1.92 11.32 1.92 10.49 2.23Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.05 11.87L10.66 13.48L14.96 9.18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42004 13.98 8.42004 12C8.42004 10.02 10.02 8.42004 12 8.42004C13.98 8.42004 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M14.53 9.47L9.47004 14.53C8.82004 13.88 8.42004 12.99 8.42004 12C8.42004 10.02 10.02 8.42004 12 8.42004C12.99 8.42004 13.88 8.82004 14.53 9.47Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.82 5.77C16.07 4.45 14.07 3.73 12 3.73C8.47 3.73 5.18 5.81 2.89 9.41C1.99 10.82 1.99 13.19 2.89 14.6C3.68 15.84 4.6 16.91 5.6 17.77" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.42004 19.53C9.56004 20.01 10.77 20.27 12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C20.78 8.88 20.42 8.39 20.05 7.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.51 12.7C15.25 14.11 14.1 15.26 12.69 15.52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.47 14.53L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L14.53 9.47" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Animated Background
const AuthBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary-400/20 to-teal-400/10 blur-[100px] animate-blob" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-teal-400/15 to-cyan-400/10 blur-[100px] animate-blob animation-delay-4000" />
    <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-violet-400/10 to-primary-400/10 blur-[80px] animate-blob animation-delay-2000" />
    
    {/* Subtle grid */}
    <div className="absolute inset-0 opacity-[0.015]" style={{
      backgroundImage: `linear-gradient(rgba(51, 97, 255, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(51, 97, 255, 0.5) 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />
  </div>
)

// Security Badge
const SecurityBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 text-sm text-slate-500">
    <span className="text-primary-500">{icon}</span>
    <span>{text}</span>
  </div>
)

// Password Strength Indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (!password) return { level: 0, text: '', color: '' }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    
    if (strength <= 2) return { level: strength, text: 'Weak', color: 'bg-error-500' }
    if (strength <= 3) return { level: strength, text: 'Fair', color: 'bg-warning-500' }
    if (strength <= 4) return { level: strength, text: 'Good', color: 'bg-teal-500' }
    return { level: strength, text: 'Strong', color: 'bg-success-500' }
  }
  
  const strength = getStrength()
  if (!password) return null
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength.level ? strength.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">Password strength: <span className="font-medium">{strength.text}</span></p>
    </div>
  )
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') as 'patient' | 'doctor' || 'patient'
  const navigate = useNavigate()
  const { login, isLoading, signUp } = useAuth()
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Check for MetaMask on component mount
    if (role === 'doctor') {
      setHasMetaMask(detectMetaMask())
    }
  }, [role])

  const handlePatientAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (authMode === 'signup') {
      // Sign Up
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long')
        return
      }
      
      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      const result = await signUp(email, password)
      
      if (result.success) {
        if (result.needsConfirmation) {
          toast.success('🎉 Account created! Please check your email to verify your account.', { duration: 6000 })
          setAuthMode('signin')
          setPassword('')
          setConfirmPassword('')
        } else {
          toast.success('🎉 Welcome to MediBytes! Redirecting to your dashboard...')
          setTimeout(() => navigate('/patient'), 1000)
        }
      } else {
        toast.error(result.error || 'Failed to create account')
      }
    } else {
      // Sign In
      try {
        await login('patient', { email, password })
        setTimeout(() => navigate('/patient'), 800)
      } catch (error) {
        // Error already shown by toast in AuthContext
      }
    }
  }

  const handleDoctorConnect = async () => {
    if (!hasMetaMask) {
      toast.error('MetaMask not detected. Please install MetaMask browser extension.', { duration: 6000 })
      return
    }

    setIsConnecting(true)
    try {
      // Request accounts - this ALWAYS triggers MetaMask popup
      // Even if user was previously connected, it will ask to select account again
      const connection = await completeWalletConnection()
      
      // Login with real wallet address
      await login('doctor', { walletAddress: connection.address })
      
      // Redirect to doctor dashboard
      setTimeout(() => navigate('/doctor'), 800)
    } catch (error: any) {
      setIsConnecting(false)
      
      // Handle specific errors
      if (error.message.includes('User rejected')) {
        toast.error('Connection rejected. Please try again.')
      } else if (error.message.includes('not installed')) {
        toast.error('MetaMask not detected. Please install MetaMask browser extension.', { duration: 6000 })
        setHasMetaMask(false)
      } else if (error.message.includes('switch')) {
        toast.error('Please switch to Polygon Amoy testnet in MetaMask.')
      } else if (error.message.includes('network')) {
        toast.error('Failed to configure Polygon Amoy network. Please try again.')
      } else {
        toast.error(error.message || 'Failed to connect wallet. Please try again.')
      }
    }
  }

  const installMetaMask = () => {
    window.open('https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn', '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 md:p-6">
      <AuthBackground />
      
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-noise" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className={`group mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
        >
          <span className="p-2 rounded-lg bg-white shadow-sm group-hover:shadow group-hover:-translate-x-1 transition-all duration-300">
            <BackIcon />
          </span>
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Main Card */}
        <div className={`bg-white rounded-3xl shadow-elevated p-8 md:p-10 border border-slate-100/80 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl  bg-white flex items-center justify-center shadow-button overflow-hidden">
              <img src="/assets/logo1.png" alt="MediBytes Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-2">
              {role === 'patient' 
                ? (authMode === 'signin' ? 'Welcome Back' : 'Create Account')
                : 'Connect Wallet'
              }
            </h1>
            <p className="text-slate-500">
              {role === 'patient' 
                ? (authMode === 'signin' 
                    ? 'Sign in to access your medical records' 
                    : 'Join MediBytes to secure your health data')
                : 'Connect your Web3 wallet to continue'
              }
            </p>
          </div>

          {/* Patient Login/SignUp Form */}
          {role === 'patient' ? (
            <div className="space-y-5">
              <form onSubmit={handlePatientAuth} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className={`relative transition-all duration-300 ${emailFocused ? 'transform scale-[1.01]' : ''}`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${emailFocused ? 'text-primary-500' : 'text-slate-400'}`}>
                      <EmailIcon />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className={`relative transition-all duration-300 ${passwordFocused ? 'transform scale-[1.01]' : ''}`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${passwordFocused ? 'text-primary-500' : 'text-slate-400'}`}>
                      <LockIcon />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {authMode === 'signup' && <PasswordStrength password={password} />}
                </div>

                {/* Confirm Password Field (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <div className={`relative transition-all duration-300 ${confirmPasswordFocused ? 'transform scale-[1.01]' : ''}`}>
                      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${confirmPasswordFocused ? 'text-primary-500' : 'text-slate-400'}`}>
                        <LockIcon />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all duration-300"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot Password (Sign In only) */}
                {authMode === 'signin' && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => toast.info('Password reset feature coming soon!')}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white rounded-xl font-semibold shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{authMode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    authMode === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </button>
              </form>

              {/* Toggle Auth Mode */}
              <div className="text-center pt-4">
                <p className="text-slate-500">
                  {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                      setPassword('')
                      setConfirmPassword('')
                    }}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    {authMode === 'signin' ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Doctor Wallet Connection */
            <div className="space-y-6">
              {!hasMetaMask ? (
                <>
                  {/* MetaMask Not Installed */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-100">
                          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-yellow-900">MetaMask Not Detected</h3>
                        <p className="mt-2 text-sm text-yellow-700">
                          MetaMask browser extension is required to connect your wallet. Please install it first.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Install Button */}
                  <button
                    onClick={installMetaMask}
                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <MetaMaskIcon />
                      <span>Install MetaMask</span>
                    </div>
                  </button>

                  {/* Instructions */}
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
                    <p className="font-medium text-slate-900">How to get started:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Click "Install MetaMask" button above</li>
                      <li>Add the extension to your browser</li>
                      <li>Create or import a wallet</li>
                      <li>Return here and connect your wallet</li>
                    </ol>
                  </div>
                </>
              ) : (
                <>
                  {/* Wallet Info Card */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                      <WalletIcon />
                    </div>
                    <p className="text-center text-slate-600 text-sm leading-relaxed">
                      Connect your Web3 wallet to securely access the doctor portal. Your wallet serves as your decentralized identity.
                    </p>
                  </div>

                  {/* MetaMask Button */}
                  <button
                    onClick={handleDoctorConnect}
                    disabled={isLoading || isConnecting}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {isConnecting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <MetaMaskIcon />
                        <span>Connect with MetaMask</span>
                      </div>
                    )}
                  </button>

                  {/* Info */}
                  <p className="text-center text-xs text-slate-400">
                    By connecting, you agree to our Terms of Service and Privacy Policy
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}