import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  authModalMode: 'login' | 'register'
  setAuthModalMode: (mode: 'login' | 'register') => void
  redirectAfterAuth: string | null
  setRedirectAfterAuth: (path: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'nft_auth_token'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null)

  // Clear private caches whenever user changes or logs out to prevent cross-user data leakage
  const clearPrivateCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['cart'] })
    queryClient.removeQueries({ queryKey: ['orders'] })
    queryClient.removeQueries({ queryKey: ['wallets'] })
    queryClient.removeQueries({ queryKey: ['favorites'] })
    queryClient.removeQueries({ queryKey: ['profile'] })
    queryClient.removeQueries({ queryKey: ['quote'] })
    queryClient.invalidateQueries({ queryKey: ['nfts'] })
  }, [queryClient])

  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY)
    if (!currentToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get<{ user: User }>('/auth/session')
      setUser(response.data.user)
    } catch {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      clearPrivateCache()
    } finally {
      setIsLoading(false)
    }
  }, [clearPrivateCache])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Listen for global session-expired events from Axios interceptor
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      clearPrivateCache()
      setRedirectAfterAuth(window.location.pathname)
      setAuthModalMode('login')
      setAuthModalOpen(true)
    }

    window.addEventListener('nft:session-expired', handleExpired)
    return () => window.removeEventListener('nft:session-expired', handleExpired)
  }, [clearPrivateCache])

  const login = async (email: string, password: string) => {
    clearPrivateCache()
    const response = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    })

    const { token: receivedToken, user: loggedUser } = response.data
    localStorage.setItem(TOKEN_KEY, receivedToken)
    setToken(receivedToken)
    setUser(loggedUser)
    setAuthModalOpen(false)

    // Invalidate user queries
    await queryClient.invalidateQueries({ queryKey: ['nfts'] })
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
  }

  const register = async (name: string, email: string, password: string) => {
    clearPrivateCache()
    const response = await api.post<{ token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
    })

    const { token: receivedToken, user: registeredUser } = response.data
    localStorage.setItem(TOKEN_KEY, receivedToken)
    setToken(receivedToken)
    setUser(registeredUser)
    setAuthModalOpen(false)

    await queryClient.invalidateQueries({ queryKey: ['nfts'] })
    await queryClient.invalidateQueries({ queryKey: ['cart'] })
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      clearPrivateCache()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        redirectAfterAuth,
        setRedirectAfterAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return ctx
}
