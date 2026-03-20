import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function RoleBasedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect to the user's own dashboard
    const dashboardRoutes = {
      customer: '/',
      seller: '/seller/dashboard',
      admin: '/admin/dashboard',
    }
    return <Navigate to={dashboardRoutes[user?.role] || '/'} replace />
  }

  return children
}
