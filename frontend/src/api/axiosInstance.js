import axios from 'axios'
import { API_BASE_URL } from '@/utils/constants'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')
    if (tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - auto refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const tokens = JSON.parse(localStorage.getItem('tokens') || '{}')

      // If user was never logged in (no tokens), just reject — don't redirect
      if (!tokens.refresh) {
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: tokens.refresh,
        })

        const newTokens = {
          access: response.data.access,
          refresh: response.data.refresh || tokens.refresh,
        }
        localStorage.setItem('tokens', JSON.stringify(newTokens))

        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        // Refresh failed — user's session is truly expired, redirect to login
        localStorage.removeItem('tokens')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
