import axiosInstance from './axiosInstance'

const sellerApi = {
  // Public
  getVendors: (params) => axiosInstance.get('/sellers/', { params }),
  getVendorBySlug: (slug) => axiosInstance.get(`/sellers/${slug}/`),

  // Seller
  register: (data) => axiosInstance.post('/sellers/register/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getProfile: () => axiosInstance.get('/sellers/me/'),
  updateProfile: (data) => axiosInstance.patch('/sellers/me/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  toggleOnline: () => axiosInstance.patch('/sellers/me/toggle-online/'),
  getDashboard: () => axiosInstance.get('/sellers/me/dashboard/'),
  getEarnings: (params) => axiosInstance.get('/sellers/me/earnings/', { params }),
  getOperatingDays: () => axiosInstance.get('/sellers/me/operating-days/'),
  updateOperatingDays: (data) => axiosInstance.put('/sellers/me/operating-days/', data),

  // Admin
  adminGetSellers: (params) => axiosInstance.get('/sellers/admin/list/', { params }),
  adminApproveSeller: (id) => axiosInstance.patch(`/sellers/admin/${id}/approve/`),
  adminRejectSeller: (id, reason) => axiosInstance.patch(`/sellers/admin/${id}/reject/`, { reason }),
  adminSuspendSeller: (id, reason) => axiosInstance.patch(`/sellers/admin/${id}/suspend/`, { reason }),
  adminDeleteSeller: (id) => axiosInstance.delete(`/sellers/admin/${id}/delete/`),
  adminGetDashboard: () => axiosInstance.get('/sellers/admin/dashboard/'),
}

export default sellerApi
