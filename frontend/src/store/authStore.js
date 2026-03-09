import { create } from 'zustand'
import { authAPI, setAuthHeader } from '../utils/api'
import { clearTokens, getAccessToken, setTokens } from '../utils/authStorage'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  restoreError: false,

  init: async () => {
    const token = getAccessToken()
    if (!token) {
      set({ user: null, loading: false, restoreError: false })
      return
    }

    setAuthHeader(token)
    try {
      const { data } = await authAPI.me()
      set({ user: data, loading: false, restoreError: false })
    } catch (error) {
      const status = error?.response?.status

      if (status === 401 || status === 403) {
        clearTokens()
        setAuthHeader(null)
        set({ user: null, loading: false, restoreError: false })
        return
      }

      set({ user: null, loading: false, restoreError: true })
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
    return me.data
  },

  logout: () => {
    clearTokens()
    setAuthHeader(null)
    set({ user: null, restoreError: false })
  },
}))

export default useAuthStore
