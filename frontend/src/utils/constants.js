export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

/** Convert relative media path to full URL */
export const mediaUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${BACKEND_URL}${path}`
}
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

export const ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  CUSTOMER: 'customer',
}

export const ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
}

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
}

export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
}

export const FOOD_TYPES = {
  VEG: 'veg',
  NON_VEG: 'non_veg',
  EGG: 'egg',
}
