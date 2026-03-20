import axiosInstance from './axiosInstance'

const addressApi = {
  getAll: () => axiosInstance.get('/auth/addresses/'),
  create: (data) => axiosInstance.post('/auth/addresses/', data),
  update: (id, data) => axiosInstance.patch(`/auth/addresses/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/auth/addresses/${id}/`),
  setDefault: (id) => axiosInstance.post(`/auth/addresses/${id}/set_default/`),
}

export default addressApi
