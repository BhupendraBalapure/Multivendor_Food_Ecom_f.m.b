import axiosInstance from './axiosInstance'

const menuApi = {
  // Public
  getCategories: () => axiosInstance.get('/menu/categories/'),
  getItems: (params) => axiosInstance.get('/menu/items/', { params }),
  getItemDetail: (id) => axiosInstance.get(`/menu/items/${id}/`),
  getPlans: (params) => axiosInstance.get('/menu/plans/', { params }),
  getPlanDetail: (id) => axiosInstance.get(`/menu/plans/${id}/`),

  // Seller - Menu Items
  sellerGetItems: (params) => axiosInstance.get('/menu/seller/items/', { params }),
  sellerCreateItem: (data) => axiosInstance.post('/menu/seller/items/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  sellerUpdateItem: (id, data) => axiosInstance.patch(`/menu/seller/items/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  sellerDeleteItem: (id) => axiosInstance.delete(`/menu/seller/items/${id}/`),
  sellerToggleItem: (id) => axiosInstance.patch(`/menu/seller/items/${id}/toggle/`),

  // Seller - Subscription Plans
  sellerGetPlans: (params) => axiosInstance.get('/menu/seller/plans/', { params }),
  sellerCreatePlan: (data) => axiosInstance.post('/menu/seller/plans/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  sellerUpdatePlan: (id, data) => axiosInstance.patch(`/menu/seller/plans/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  sellerDeletePlan: (id) => axiosInstance.delete(`/menu/seller/plans/${id}/`),
  sellerSetPlanItems: (id, items) => axiosInstance.post(`/menu/seller/plans/${id}/items/`, { items }),

  // Admin - Categories
  adminGetCategories: () => axiosInstance.get('/menu/admin/categories/'),
  adminCreateCategory: (data) => axiosInstance.post('/menu/admin/categories/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  adminUpdateCategory: (id, data) => axiosInstance.patch(`/menu/admin/categories/${id}/`, data),
  adminDeleteCategory: (id) => axiosInstance.delete(`/menu/admin/categories/${id}/`),
}

export default menuApi
