import axiosInstance from './axiosInstance'

const adminApi = {
  // Dashboard & Reports
  getDashboard: () => axiosInstance.get('/sellers/admin/dashboard/'),
  getReports: (params) => axiosInstance.get('/sellers/admin/reports/', { params }),

  // Users
  getUsers: (params) => axiosInstance.get('/auth/admin/users/', { params }),
  toggleUserActive: (id) => axiosInstance.patch(`/auth/admin/users/${id}/toggle-active/`),
  editUser: (id, data) => axiosInstance.patch(`/auth/admin/users/${id}/edit/`, data),
  deleteUser: (id) => axiosInstance.delete(`/auth/admin/users/${id}/delete/`),

  // Orders
  getOrders: (params) => axiosInstance.get('/orders/admin/', { params }),
  getOrderDetail: (id) => axiosInstance.get(`/orders/admin/${id}/`),
  updateOrderStatus: (id, status) => axiosInstance.patch(`/orders/admin/${id}/status/`, { status }),
  addOrderItem: (id, data) => axiosInstance.post(`/orders/admin/${id}/add-item/`, data),
  updateOrderItem: (id, itemId, data) => axiosInstance.patch(`/orders/admin/${id}/items/${itemId}/`, data),
  deleteOrderItem: (id, itemId) => axiosInstance.delete(`/orders/admin/${id}/items/${itemId}/delete/`),

  // Subscriptions
  getSubscriptions: (params) => axiosInstance.get('/subscriptions/admin/', { params }),

  // Contact Messages
  getContacts: () => axiosInstance.get('/admin/contacts/'),
  toggleContactRead: (id) => axiosInstance.patch(`/admin/contacts/${id}/read/`),
  deleteContact: (id) => axiosInstance.delete(`/admin/contacts/${id}/delete/`),
}

export default adminApi
