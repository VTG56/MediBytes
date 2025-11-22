// ============================================
// MediBytes - Core Type Definitions
// ============================================

import { User as SupabaseUser } from '@supabase/supabase-js'

// User Types
export interface User {
  id: string
  email?: string
  walletAddress?: string
  role: 'patient' | 'doctor'
  isLoggedIn: boolean
  name?: string
  avatar?: string
  supabaseUser?: SupabaseUser
}

// Auth Context Types
export interface AuthContextType {
  user: User | null
  login: (role: 'patient' | 'doctor', credentials?: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>
}

export interface LoginCredentials {
  email?: string
  password?: string
  walletAddress?: string
}

// Auth Error Types
export interface AuthError {
  message: string
  code?: string
}

// Auth State Types
export type AuthMode = 'signin' | 'signup'

// Medical Record Types
export interface MedicalRecord {
  id: string
  title: string
  type: 'lab_result' | 'prescription' | 'imaging' | 'diagnosis' | 'vaccination' | 'other'
  date: string
  provider: string
  ipfsHash: string
  isEncrypted: boolean
  accessList: string[]
}

// Organ Donation Types
export interface OrganDonor {
  id: string
  walletAddress: string
  bloodType: string
  organs: string[]
  registrationDate: string
  status: 'active' | 'inactive' | 'matched'
}

// Access Request Types
export interface AccessRequest {
  id: string
  requesterId: string
  requesterName: string
  requesterRole: 'doctor' | 'hospital' | 'insurance'
  recordId: string
  status: 'pending' | 'approved' | 'denied'
  requestDate: string
  expiryDate?: string
}

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Feature Card Types
export interface FeatureCard {
  title: string
  description?: string
  icon: React.ReactNode
  path: string
  gradient: string
  hoverGradient?: string
}

// Stats Types
export interface StatItem {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

// Navigation Types
export interface NavItem {
  label: string
  path: string
  icon?: React.ReactNode
  badge?: string | number
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export interface CardProps {
  variant?: 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export interface InputProps {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
}

// Animation Types
export interface AnimationConfig {
  initial?: object
  animate?: object
  exit?: object
  transition?: object
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination Types
export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrevious: boolean
}

// Filter Types
export interface FilterOption {
  id: string
  label: string
  value: string
  count?: number
}

// Sort Types
export interface SortOption {
  id: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}