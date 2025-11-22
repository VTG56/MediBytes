import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthContextType, LoginCredentials } from './types'
import { supabase } from './supabaseClient'
import { AuthError } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // User is authenticated via Supabase (Patient)
          const userData: User = {
            id: session.user.id,
            email: session.user.email,
            role: 'patient',
            isLoggedIn: true,
            supabaseUser: session.user
          }
          setUser(userData)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email,
            role: 'patient',
            isLoggedIn: true,
            supabaseUser: session.user
          }
          setUser(userData)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data on token refresh
          const userData: User = {
            id: session.user.id,
            email: session.user.email,
            role: 'patient',
            isLoggedIn: true,
            supabaseUser: session.user
          }
          setUser(userData)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Patient Sign Up
  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'patient'
          },
          emailRedirectTo: window.location.origin + '/patient'
        }
      })

      if (error) {
        // Provide user-friendly signup error messages
        if (error.message.includes('already registered')) {
          return { success: false, error: 'This email is already registered. Please sign in instead.' }
        }
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Check if email already exists
        if (data.user.identities && data.user.identities.length === 0) {
          return { success: false, error: 'This email is already registered. Please sign in instead.' }
        }
        
        // Check if email confirmation is required (session will be null if confirmation needed)
        if (!data.session) {
          return { success: true, needsConfirmation: true }
        }
        
        // User is automatically signed in (email confirmation disabled)
        if (data.session) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: 'patient',
            isLoggedIn: true,
            supabaseUser: data.user
          }
          setUser(userData)
          return { success: true, needsConfirmation: false }
        }
      }

      return { success: false, error: 'Failed to create account' }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message || 'An unexpected error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  // Patient Login (Email/Password) or Doctor Login (Wallet)
  const login = async (role: 'patient' | 'doctor', credentials?: LoginCredentials) => {
    try {
      setIsLoading(true)

      if (role === 'patient' && credentials?.email && credentials?.password) {
        // Supabase email/password login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })

        if (error) {
          // Provide user-friendly error messages
          if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email address before signing in. Check your inbox for the confirmation link.', { duration: 6000 })
          } else if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please try again.')
          } else {
            toast.error(error.message || 'Failed to sign in')
          }
          throw error
        }

        if (data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: 'patient',
            isLoggedIn: true,
            supabaseUser: data.user
          }
          setUser(userData)
          toast.success(`Welcome back, ${data.user.email?.split('@')[0]}! 👋`)
        }
      } else if (role === 'doctor' && credentials?.walletAddress) {
        // Mock wallet login for doctors (unchanged)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const userData: User = {
          id: Math.random().toString(),
          role: 'doctor',
          isLoggedIn: true,
          walletAddress: credentials.walletAddress
        }
        setUser(userData)
        toast.success(`🔗 Wallet connected: ${credentials.walletAddress.slice(0, 6)}...${credentials.walletAddress.slice(-4)}`, { duration: 2000 })
      } else {
        toast.error('Invalid credentials provided')
        throw new Error('Invalid credentials')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      // Don't show duplicate error toast if already shown above
      if (!error.message?.includes('Email not confirmed') && !error.message?.includes('Invalid login credentials')) {
        toast.error(error.message || 'Failed to login')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    try {
      const userName = user?.email?.split('@')[0] || 'User'
      
      if (user?.role === 'patient') {
        // Supabase logout for patients - clear all sessions and storage
        try {
          // First, clear the session from Supabase
          await supabase.auth.signOut()
          
          // Also clear any stored tokens manually as a backup
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.removeItem('supabase.auth.token')
          
          // Clear all Supabase keys from storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key)
            }
          })
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-')) {
              sessionStorage.removeItem(key)
            }
          })
        } catch (signOutError: any) {
          // Handle network errors or other exceptions
          console.error('SignOut exception:', signOutError)
          // Even if signOut fails, force clear local storage
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.removeItem('supabase.auth.token')
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key)
            }
          })
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-')) {
              sessionStorage.removeItem(key)
            }
          })
        }
      }
      
      // Clear user state
      setUser(null)
      toast.success(`👋 Goodbye, ${userName}! See you next time.`)
      
      // Redirect to home page after logout
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even on error
      setUser(null)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}