import { create } from 'zustand'
import { authAPI, setAuthHeader } from '../utils/api'
import { clearTokens, getAccessToken, setTokens } from '../utils/authStorage'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = getAccessToken()
    if (!token) { set({ loading: false }); return }
    setAuthHeader(token)
    try {
      const { data } = await authAPI.me()
      set({ user: data, loading: false })
    } catch {
      clearTokens()
      setAuthHeader(null)
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    setTokens(data.access_token, data.refresh_token)
    setAuthHeader(data.access_token)
    const me = await authAPI.me()
    set({ user: me.data })
    return me.data
  },

  register: async (formData) => {
    await authAPI.register(formData)
    const { data } = await authAPI.login({
      email: formData.email,
      password: formData.password,
    })
    setTokens(data.access_token, data.refresh_token)
    setAuthHeader(data.access_token)
    const me = await authAPI.me()
    set({ user: me.data })
    return me.data
  },

  logout: () => {
    clearTokens()
    setAuthHeader(null)
    set({ user: null })
  },
}))

export default useAuthStore
