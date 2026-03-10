import axios from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(', ') || fallback
  }

  if (detail && typeof detail === 'object') {
    return detail.msg || detail.message || fallback
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  return fallback
}

function redirectToLogin() {
  clearTokens()
  setAuthHeader(null)
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Request interceptor – attach token
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor – handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (status === 401) {
      const refresh = getRefreshToken()
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refresh })
          setTokens(data.access_token, data.refresh_token)
          setAuthHeader(data.access_token)
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(error.config)
        } catch {
          redirectToLogin()
        }
      } else {
        redirectToLogin()
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ─── Typed API helpers ───────────────────────────────────────
export const authAPI = {
  register:       (d) => api.post('/auth/register', d),
  login:          (d) => api.post('/auth/login', d),
  me:             ()  => api.get('/auth/me'),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
}

export const usersAPI = {
  getProfile:    (id) => api.get(`/users/profile/${id}`),
  updateProfile: (d)  => api.patch('/users/me', d),
  getNotifs:     ()   => api.get('/users/notifications'),
  readNotifs:    ()   => api.post('/users/notifications/read'),
}

export const skillsAPI = {
  list:           ()   => api.get('/skills/'),
  mySkills:       ()   => api.get('/skills/my'),
  addSkill:       (d)  => api.post('/skills/my', d),
  getMentors:     (id) => api.get(`/skills/mentors/${id}`),
  getQuiz:        (id) => api.get(`/skills/verify/${id}/quiz`),
  submitQuiz:     (d)  => api.post('/skills/verify/submit', d),
  recommendations:()   => api.get('/skills/recommendations'),
}

export const sessionsAPI = {
  book:       (d)  => api.post('/sessions/', d),
  my:         ()   => api.get('/sessions/my'),
  get:        (id) => api.get(`/sessions/${id}`),
  confirm:    (id) => api.post(`/sessions/${id}/confirm`),
  cancel:     (id, d) => api.post(`/sessions/${id}/cancel`, d),
  complete:   (id) => api.post(`/sessions/${id}/complete`),
  feedback:   (id, d) => api.post(`/sessions/${id}/feedback`, d),
}

export const tasksAPI = {
  list:     (p) => api.get('/tasks/', { params: p }),
  create:   (d) => api.post('/tasks/', d),
  my:       ()  => api.get('/tasks/my'),
  get:      (id) => api.get(`/tasks/${id}`),
  accept:   (id) => api.post(`/tasks/${id}/accept`),
  submit:   (id, d) => api.post(`/tasks/${id}/submit`, d),
  complete: (id) => api.post(`/tasks/${id}/complete`),
  feedback: (id, d) => api.post(`/tasks/${id}/feedback`, d),
}

export const paymentsAPI = {
  createOrder:   (d) => api.post('/payments/order', d),
  demoOrder:     ()  => api.post('/payments/demo'),
  verify:        (d) => api.post('/payments/verify', d),
  wallet:        ()  => api.get('/payments/wallet'),
  transactions:  ()  => api.get('/payments/transactions'),
}

export const aiAPI = {
  chat:       (d)  => api.post('/ai/chat', d),
  fraudCheck: (id) => api.get(`/ai/fraud-check/${id}`),
}

export const adminAPI = {
  stats:          ()    => api.get('/admin/stats'),
  users:          (p)   => api.get('/admin/users', { params: p }),
  banUser:        (id)  => api.post(`/admin/users/${id}/ban`, {}),
  unbanUser:      (id)  => api.post(`/admin/users/${id}/unban`),
  tasks:          (p)   => api.get('/admin/tasks', { params: p }),
  flagTask:       (id, r) => api.post(`/admin/tasks/${id}/flag`, { reason: r }),
  fraudLogs:      ()    => api.get('/admin/fraud-logs'),
  reviewFraudLog: (id)  => api.post(`/admin/fraud-logs/${id}/review`),
}
