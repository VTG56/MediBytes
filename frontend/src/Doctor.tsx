import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { onAccountChange, onChainChange } from './utils/metamask'
import toast from 'react-hot-toast'

// Icons
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M17 9.5V5C17 3.9 16.1 3 15 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H15C16.1 21 17 20.1 17 19V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 12H21M21 12L18.5 9.5M21 12L18.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.6915026,9.4744071 C19.7621845,8.635618 19.4248389,7.81624966 18.8757592,7.26844004 L18.2151972,6.60788069 C17.6659187,6.05921907 16.8474256,5.71975398 16.0074168,5.71975398 C15.1674081,5.71975398 14.3499618,6.05921907 13.7999787,6.60788069 L13.1294992,7.27922838 C12.5793816,7.82789 11.7624644,8.17321503 10.9230769,8.17321503 C10.0836894,8.17321503 9.26667371,7.82789 8.71755612,7.27922838 L8.04707743,6.60788069 C7.49779887,6.05921907 6.67930571,5.71975398 5.83929705,5.71975398 C4.99928839,5.71975398 4.18148408,6.05921907 3.63240849,6.60788069 L3.03964745,7.20063173 C2.48556581,7.75169346 2.16326531,8.57106179 2.16326531,9.4744071 L2.16326531,9.4744071 C2.16326531,10.3148347 2.50273041,11.1324 3.05180601,11.6805181" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12,2 L12,2 C6.4771525,2 2,6.4771525 2,12 L2,12 C2,17.5228475 6.4771525,22 12,22 L12,22 C17.5228475,22 22,17.5228475 22,12 L22,12 C22,6.4771525 17.5228475,2 12,2 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M6 9C4.89543 9 4 9.89543 4 11V20C4 21.1046 4.89543 22 6 22H15C16.1046 22 17 21.1046 17 20V11C17 9.89543 16.1046 9 15 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 5H18C19.1046 5 20 5.89543 20 7V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DoctorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
    <path d="M18 18.86H17.24C16.44 18.86 15.68 19.17 15.12 19.73L13.41 21.42C12.63 22.19 11.36 22.19 10.58 21.42L8.87 19.73C8.31 19.17 7.54 18.86 6.75 18.86H6C4.34 18.86 3 17.53 3 15.89V4.97C3 3.33 4.34 2 6 2H18C19.66 2 21 3.33 21 4.97V15.88C21 17.52 19.66 18.86 18 18.86Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 10C13.2868 10 14.33 8.95681 14.33 7.67C14.33 6.38319 13.2868 5.34 12 5.34C10.7132 5.34 9.67001 6.38319 9.67001 7.67C9.67001 8.95681 10.7132 10 12 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 15.66C16 13.86 14.21 12.4 12 12.4C9.79 12.4 8 13.86 8 15.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function Doctor() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({
    pending_approvals: 0,
    patients_queued: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000'

  useEffect(() => {
    // Fetch doctor stats
    const fetchStats = async () => {
      try {
        const mockDoctorToken = localStorage.getItem('doctor_token') || 'mock_doctor_token'
        
        const response = await fetch(`${BACKEND_API_URL}/api/doctor/stats`, {
          headers: {
            'Authorization': `Bearer ${mockDoctorToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.stats) {
            setStats(data.stats)
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()

    // Set wallet address
    if (user?.walletAddress) {
      setWalletAddress(user.walletAddress)
    }

    // Listen for account changes from MetaMask
    const unsubscribeAccountChange = onAccountChange((accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        toast.error('Wallet disconnected. Logging out...')
        logout()
        navigate('/')
      } else if (accounts[0].toLowerCase() !== user?.walletAddress?.toLowerCase()) {
        // User switched to a different account
        toast.error('Wallet account changed. Please reconnect to continue.')
        logout()
        navigate('/')
      }
    })

    // Listen for chain changes
    const unsubscribeChainChange = onChainChange(() => {
      toast.warning('Network changed. Please ensure you are on Polygon Amoy testnet.')
    })

    // Cleanup listeners
    return () => {
      unsubscribeAccountChange()
      unsubscribeChainChange()
    }
  }, [user, logout, navigate])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      toast.success('Wallet address copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const handleLogout = async () => {
    // Clear listeners before logout
    try {
      if (window.ethereum?.removeAllListeners) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    } catch (error) {
      console.log('Error removing listeners:', error)
    }
    
    await logout()
    // Redirect to home, force MetaMask re-auth on next login
    setTimeout(() => navigate('/'), 800)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-button overflow-hidden">
                <img src="/assets/logo1.png" alt="MediBytes Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl font-display font-bold text-slate-900">MediBytes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="group px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center text-white shadow-button">
              <DoctorIcon />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-slate-900">Doctor Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome to the MediBytes Doctor Portal</p>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Wallet Info Card */}
          <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 border border-slate-100 group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary-500/20">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M18.04 13.55C17.62 13.96 17.38 14.55 17.44 15.18C17.53 16.26 18.52 17.05 19.6 17.05H21.5V18.24C21.5 20.31 19.81 22 17.74 22H6.26C4.19 22 2.5 20.31 2.5 18.24V11.51C2.5 9.44 4.19 7.75 6.26 7.75H17.74C19.81 7.75 21.5 9.44 21.5 11.51V12.95H19.48C18.92 12.95 18.41 13.17 18.04 13.55Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Connected Wallet</h3>
                <p className="text-sm text-slate-500">MetaMask</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">Wallet Address</p>
              <p className="font-mono text-sm font-semibold text-slate-900 break-all">{walletAddress}</p>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-50 to-teal-50 hover:from-primary-100 hover:to-teal-100 text-primary-700 font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2 border border-primary-200/50"
            >
              <CopyIcon />
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Stats</h3>
            
            {loadingStats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded"></div>
                  <div className="h-8 w-12 bg-slate-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 animate-pulse">
                  <div className="h-5 w-32 bg-slate-200 rounded"></div>
                  <div className="h-8 w-12 bg-slate-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary-50 to-teal-50 border border-primary-100/50">
                  <span className="text-slate-700 font-medium">Pending Approvals</span>
                  <span className="text-2xl font-bold text-primary-600">{stats.pending_approvals}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100">
                  <span className="text-slate-700 font-medium">Patients Queued</span>
                  <span className="text-2xl font-bold text-slate-900">{stats.patients_queued}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => navigate('/doctor/queue')}
            className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 border border-slate-100 text-left overflow-hidden hover:-translate-y-0.5"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-primary-400/10 to-primary-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary-500/25 relative">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"/>
                <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"/>
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-lg">Patient Queue</h3>
            <p className="text-sm text-slate-600">Manage patient appointments and requests</p>
            <div className="mt-4 flex items-center text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
              View Queue
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-2">
                <path d="M14.43 5.93L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/doctor/approvals')}
            className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 border border-slate-100 text-left overflow-hidden hover:-translate-y-0.5"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25 relative">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M10.49 2.23L5.49999 4.11C4.34999 4.54 3.40999 5.9 3.40999 7.12V14.55C3.40999 15.73 4.18999 17.28 5.13999 17.99L9.43999 21.2C10.85 22.26 13.17 22.26 14.58 21.2L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12C20.61 5.89 19.67 4.53 18.52 4.1L13.53 2.23C12.68 1.92 11.32 1.92 10.49 2.23Z"/>
                <path d="M9.05 11.87L10.66 13.48L14.96 9.18"/>
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-lg">Pending Approvals</h3>
            <p className="text-sm text-slate-600">Review and approve access requests</p>
            <div className="mt-4 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
              Review Approvals
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-2">
                <path d="M14.43 5.93L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/doctor/organs')}
            className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-8 border border-slate-100 text-left overflow-hidden hover:-translate-y-0.5"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-rose-400/10 to-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
            
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-rose-500/25 relative">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-lg">Organ Donations</h3>
            <p className="text-sm text-slate-600">View organ donation matches and registry</p>
            <div className="mt-4 flex items-center text-rose-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
              View Donations
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 ml-2">
                <path d="M14.43 5.93L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-gradient-to-r from-primary-50 to-teal-50 rounded-2xl p-6 border border-primary-200/60">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-primary-600">
                <path d="M10.49 2.23L5.49999 4.11C4.34999 4.54 3.40999 5.9 3.40999 7.12V14.55C3.40999 15.73 4.18999 17.28 5.13999 17.99L9.43999 21.2C10.85 22.26 13.17 22.26 14.58 21.2L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12C20.61 5.89 19.67 4.53 18.52 4.1L13.53 2.23C12.68 1.92 11.32 1.92 10.49 2.23Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.05 11.87L10.66 13.48L14.96~ 9.18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-primary-900">Security Notice</h3>
              <p className="text-sm text-primary-800 mt-1">
                Your wallet address is your unique identifier. If you disconnect or switch accounts in MetaMask, you will be automatically logged out. When you logout and login again, MetaMask will ask you to select your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}