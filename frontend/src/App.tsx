import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import LandingPage from './LandingPage'
import AuthPage from './AuthPage'
import Patient from './Patient'
import Doctor from './Doctor'
import HealthInsights from './HealthInsights'
import { 
  UploadRecord, 
  MyRecords, 
  RegisterDonor, 
  AccessControl,
  PatientQueue,
  PendingApprovals,
  OrganDonations 
} from './FeaturePages'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'patient' | 'doctor' }) {
  const { user } = useAuth()
  
  if (!user?.isLoggedIn) {
    return <Navigate to="/" replace />
  }
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'patient' ? '/patient' : '/doctor'} replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={user?.isLoggedIn ? <Navigate to={user.role === 'patient' ? '/patient' : '/doctor'} replace /> : <LandingPage />} />
      <Route path="/auth" element={user?.isLoggedIn ? <Navigate to={user.role === 'patient' ? '/patient' : '/doctor'} replace /> : <AuthPage />} />
      
      {/* Patient Routes */}
      <Route path="/patient" element={<ProtectedRoute role="patient"><Patient /></ProtectedRoute>} />
      <Route path="/patient/upload" element={<ProtectedRoute role="patient"><UploadRecord /></ProtectedRoute>} />
      <Route path="/patient/records" element={<ProtectedRoute role="patient"><MyRecords /></ProtectedRoute>} />
      <Route path="/patient/donor" element={<ProtectedRoute role="patient"><RegisterDonor /></ProtectedRoute>} />
      <Route path="/patient/health-insights" element={<ProtectedRoute role="patient"><HealthInsights /></ProtectedRoute>} />
      <Route path="/patient/access" element={<ProtectedRoute role="patient"><AccessControl /></ProtectedRoute>} />
      
      {/* Doctor Routes */}
      <Route path="/doctor" element={<ProtectedRoute role="doctor"><Doctor /></ProtectedRoute>} />
      <Route path="/doctor/queue" element={<ProtectedRoute role="doctor"><PatientQueue /></ProtectedRoute>} />
      <Route path="/doctor/approvals" element={<ProtectedRoute role="doctor"><PendingApprovals /></ProtectedRoute>} />
      <Route path="/doctor/organs" element={<ProtectedRoute role="doctor"><OrganDonations /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
