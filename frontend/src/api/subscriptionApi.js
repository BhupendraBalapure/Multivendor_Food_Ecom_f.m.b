import axiosInstance from './axiosInstance'

const subscriptionApi = {
  // Customer
  getSubscriptions: (params) => axiosInstance.get('/subscriptions/', { params }),
  getSubscriptionDetail: (id) => axiosInstance.get(`/subscriptions/${id}/`),
  subscribe: (data) => axiosInstance.post('/subscriptions/subscribe/', data),
  skipDate: (id, data) => axiosInstance.post(`/subscriptions/${id}/skip/`, data),
  pause: (id) => axiosInstance.post(`/subscriptions/${id}/pause/`),
  resume: (id) => axiosInstance.post(`/subscriptions/${id}/resume/`),
  cancel: (id) => axiosInstance.post(`/subscriptions/${id}/cancel/`),
  getCalendar: (id) => axiosInstance.get(`/subscriptions/${id}/calendar/`),

  // Seller
  sellerGetSubscriptions: (params) => axiosInstance.get('/subscriptions/seller/', { params }),
  sellerGetDetail: (id) => axiosInstance.get(`/subscriptions/seller/${id}/`),
  sellerGetTodayOrders: () => axiosInstance.get('/subscriptions/seller/today/'),
}

export default subscriptionApi
