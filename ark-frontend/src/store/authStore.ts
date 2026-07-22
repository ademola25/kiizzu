import { create } from 'zustand'
import api, { setAccessToken } from '@/api/client'

interface User {
  id: number
  email: string
  name: string
  phone: string
  onboarding_complete: boolean
  whatsapp_opted_in: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  register: async (data) => {
    const { data: resp } = await api.post('/auth/register/', data)
    setAccessToken(resp.access)
    localStorage.setItem('ark_refresh', resp.refresh)
    set({ user: resp.user, isAuthenticated: true })
  },

  login: async (email, password) => {
    const { data: resp } = await api.post('/auth/login/', { email, password })
    setAccessToken(resp.access)
    localStorage.setItem('ark_refresh', resp.refresh)
    set({ user: resp.user, isAuthenticated: true })
  },

  logout: async () => {
    const refresh = localStorage.getItem('ark_refresh')
    try {
      await api.post('/auth/logout/', { refresh })
    } catch {
      // ignore logout errors
    }
    setAccessToken(null)
    localStorage.removeItem('ark_refresh')
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    const refresh = localStorage.getItem('ark_refresh')
    if (!refresh) {
      set({ isLoading: false })
      return
    }
    try {
      // Try refreshing the token first
      const { data: tokenData } = await api.post('/auth/refresh/', { refresh })
      setAccessToken(tokenData.access)
      if (tokenData.refresh) {
        localStorage.setItem('ark_refresh', tokenData.refresh)
      }
      const { data: user } = await api.get('/auth/me/')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      setAccessToken(null)
      localStorage.removeItem('ark_refresh')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
