import axiosInstance from './axiosInstance'

const orderApi = {
  // Customer
  getDashboard: () => axiosInstance.get('/orders/dashboard/'),
  getOrders: (params) => axiosInstance.get('/orders/', { params }),
  getOrderDetail: (id) => axiosInstance.get(`/orders/${id}/`),
  createOrder: (data) => axiosInstance.post('/orders/create/', data),
  cancelOrder: (id, reason) => axiosInstance.post(`/orders/${id}/cancel/`, { reason }),
  submitReview: (orderId, data) => axiosInstance.post(`/orders/${orderId}/review/`, data),
  getSellerReviews: (sellerId) => axiosInstance.get(`/orders/reviews/seller/${sellerId}/`),

  // Seller
  sellerGetOrders: (params) => axiosInstance.get('/orders/seller/', { params }),
  sellerGetOrderDetail: (id) => axiosInstance.get(`/orders/seller/${id}/`),
  sellerAcceptOrder: (id) => axiosInstance.patch(`/orders/seller/${id}/accept/`),
  sellerRejectOrder: (id, reason) => axiosInstance.patch(`/orders/seller/${id}/reject/`, { reason }),
  sellerUpdateStatus: (id, status) => axiosInstance.patch(`/orders/seller/${id}/status/`, { status }),
  sellerAddOrderItem: (id, data) => axiosInstance.post(`/orders/seller/${id}/add-item/`, data),
  sellerUpdateOrderItem: (id, itemId, data) => axiosInstance.patch(`/orders/seller/${id}/items/${itemId}/`, data),
  sellerDeleteOrderItem: (id, itemId) => axiosInstance.delete(`/orders/seller/${id}/items/${itemId}/delete/`),
}

export default orderApi
