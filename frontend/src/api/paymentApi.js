import axiosInstance from './axiosInstance'

const paymentApi = {
  createRazorpayOrder: (data) => axiosInstance.post('/payments/create-order/', data),
  verifyPayment: (data) => axiosInstance.post('/payments/verify/', data),
  getPayments: (params) => axiosInstance.get('/payments/', { params }),
}

export default paymentApi
