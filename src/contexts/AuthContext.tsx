"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  plan?: string | null
  role?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (provider?: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (session?.user) {
      setUser({
        id: (session.user as any).id || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        plan: (session.user as any).plan,
        role: (session.user as any).role,
      })
    } else {
      setUser(null)
    }

    setLoading(false)
  }, [session, status])

  const handleSignIn = async (provider?: string) => {
    try {
      await signIn(provider || 'google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleRefreshSession = async () => {
    try {
      await update()
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshSession: handleRefreshSession,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
