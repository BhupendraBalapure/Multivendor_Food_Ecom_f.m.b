import axiosInstance from './axiosInstance'

const authApi = {
  signup: (data) => axiosInstance.post('/auth/signup/', data),
  login: (data) => axiosInstance.post('/auth/login/', data),
  logout: (refresh) => axiosInstance.post('/auth/logout/', { refresh }),
  getMe: () => axiosInstance.get('/auth/me/'),
  updateMe: (data) => axiosInstance.patch('/auth/me/', data),
  changePassword: (data) => axiosInstance.post('/auth/change-password/', data),
  sendOTP: (data) => axiosInstance.post('/auth/send-otp/', data),
  verifyOTP: (data) => axiosInstance.post('/auth/verify-otp/', data),
  refreshToken: (refresh) => axiosInstance.post('/auth/token/refresh/', { refresh }),
  resetPassword: (data) => axiosInstance.post('/auth/reset-password/', data),
  deleteAccount: (data) => axiosInstance.post('/auth/delete-account/', data),
}

export default authApi
