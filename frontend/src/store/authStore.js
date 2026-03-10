import { create } from 'zustand'
import { authAPI, setAuthHeader } from '../utils/api'
import { clearTokens, getAccessToken, setTokens, getCachedUser, setCachedUser } from '../utils/authStorage'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  restoreError: false,

  init: async () => {
    const token = getAccessToken()
    if (!token) {
      setCachedUser(null)
      set({ user: null, loading: false, restoreError: false })
      return
    }

    setAuthHeader(token)
    const cachedUser = getCachedUser()
    if (cachedUser) {
      set({ user: cachedUser, loading: false, restoreError: false })
    }
    try {
      const { data } = await Promise.race([
        authAPI.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
      set({ user: data, loading: false, restoreError: false })
      setCachedUser(data)
    } catch (error) {
      const status = error?.response?.status

      if (status === 401 || status === 403) {
        clearTokens()
        setAuthHeader(null)
        setCachedUser(null)
        set({ user: null, loading: false, restoreError: false })
        return
      }

      if (!cachedUser) {
        set({ user: null, loading: false, restoreError: true })
      }
    }
  },

  retryInit: async () => {
    set({ loading: true, restoreError: false })
    await get().init()
  },

  login: async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    setTokens(data.access_token, data.refresh_token)
    setAuthHeader(data.access_token)
    const me = await authAPI.me()
    set({ user: me.data, restoreError: false })
    setCachedUser(me.data)
    return me.data
  },

  loginWithTokens: async (tokens) => {
    if (!tokens?.access_token) return null
    setTokens(tokens.access_token, tokens.refresh_token)
    setAuthHeader(tokens.access_token)
    const me = await authAPI.me()
    set({ user: me.data, restoreError: false })
    setCachedUser(me.data)
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
    set({ user: me.data, restoreError: false })
    setCachedUser(me.data)
    return me.data
  },

  logout: () => {
    clearTokens()
    setAuthHeader(null)
    setCachedUser(null)
    set({ user: null, restoreError: false })
  },
}))

export default useAuthStore
