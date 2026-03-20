import { format, formatDistanceToNow } from 'date-fns'

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (date) => {
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatDateTime = (date) => {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
