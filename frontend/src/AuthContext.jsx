import { createContext, useContext, useEffect, useState } from 'react'
import { auth as authApi } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('aimanju_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('aimanju_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (studentId, password) => {
    const result = await authApi.login(studentId, password)
    localStorage.setItem('aimanju_token', result.access_token)
    const currentUser = await authApi.me()
    setUser(currentUser)
    return currentUser
  }

  const register = async ({ name, email, studentId, className, password }) => {
    const result = await authApi.register(email, password, name, '', studentId, className)
    localStorage.setItem('aimanju_token', result.access_token)
    const currentUser = await authApi.me()
    setUser(currentUser)
    return currentUser
  }

  const updateProfile = async (data) => {
    const updated = await authApi.updateSettings(data)
    setUser(updated)
    return updated
  }

  const logout = () => {
    localStorage.removeItem('aimanju_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
