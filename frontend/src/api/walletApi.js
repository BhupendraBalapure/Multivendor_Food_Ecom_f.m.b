import axiosInstance from './axiosInstance'

const walletApi = {
  getBalance: () => axiosInstance.get('/wallet/balance/'),
  recharge: (data) => axiosInstance.post('/wallet/recharge/', data),
  getTransactions: (params) => axiosInstance.get('/wallet/transactions/', { params }),
}

export default walletApi
