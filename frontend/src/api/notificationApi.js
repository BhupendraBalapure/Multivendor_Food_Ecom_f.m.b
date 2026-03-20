import axiosInstance from './axiosInstance'

const notificationApi = {
  getAll: (params) => axiosInstance.get('/notifications/', { params }),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count/'),
  markRead: (id) => axiosInstance.patch(`/notifications/${id}/read/`),
  markAllRead: () => axiosInstance.post('/notifications/mark-all-read/'),
}

export default notificationApi
