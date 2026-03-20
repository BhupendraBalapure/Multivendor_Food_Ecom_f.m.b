import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'

import PublicLayout from '@/components/layout/PublicLayout'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import RoleBasedRoute from '@/components/common/RoleBasedRoute'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Public Pages (eager - landing pages)
import Home from '@/pages/public/Home'
import NotFound from '@/pages/NotFound'

// Lazy-loaded pages
const Categories = lazy(() => import('@/pages/public/Categories'))
const Products = lazy(() => import('@/pages/public/Products'))
const ProductDetail = lazy(() => import('@/pages/public/ProductDetail'))
const VendorsList = lazy(() => import('@/pages/public/VendorsList'))
const VendorDetail = lazy(() => import('@/pages/public/VendorDetail'))
const Plans = lazy(() => import('@/pages/public/Plans'))
const PlanDetail = lazy(() => import('@/pages/public/PlanDetail'))
const About = lazy(() => import('@/pages/public/About'))
const Contact = lazy(() => import('@/pages/public/Contact'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))

// Customer Pages
const CustomerDashboard = lazy(() => import('@/pages/customer/Dashboard'))
const CustomerCart = lazy(() => import('@/pages/customer/Cart'))
const CustomerCheckout = lazy(() => import('@/pages/customer/Checkout'))
const CustomerOrders = lazy(() => import('@/pages/customer/Orders'))
const CustomerOrderDetail = lazy(() => import('@/pages/customer/OrderDetail'))
const CustomerAddresses = lazy(() => import('@/pages/customer/Addresses'))
const CustomerSubscriptions = lazy(() => import('@/pages/customer/Subscriptions'))
const CustomerSubscriptionDetail = lazy(() => import('@/pages/customer/SubscriptionDetail'))
const Subscribe = lazy(() => import('@/pages/customer/Subscribe'))
const CustomerWallet = lazy(() => import('@/pages/customer/Wallet'))
const CustomerProfile = lazy(() => import('@/pages/customer/Profile'))

// Seller Pages
const SellerDashboard = lazy(() => import('@/pages/seller/Dashboard'))
const SellerOnboarding = lazy(() => import('@/pages/seller/Onboarding'))
const SellerMenuManagement = lazy(() => import('@/pages/seller/MenuManagement'))
const SellerPlansManagement = lazy(() => import('@/pages/seller/PlansManagement'))
const SellerOrders = lazy(() => import('@/pages/seller/Orders'))
const SellerSubscribers = lazy(() => import('@/pages/seller/Subscribers'))
const SellerEarnings = lazy(() => import('@/pages/seller/Earnings'))
const SellerSettings = lazy(() => import('@/pages/seller/Settings'))

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const SellersManagement = lazy(() => import('@/pages/admin/SellersManagement'))
const UsersManagement = lazy(() => import('@/pages/admin/UsersManagement'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminSubscriptions = lazy(() => import('@/pages/admin/AdminSubscriptions'))
const Reports = lazy(() => import('@/pages/admin/Reports'))
const ContactMessages = lazy(() => import('@/pages/admin/ContactMessages'))

const S = ({ children }) => <Suspense fallback={<LoadingSpinner className="py-16" />}>{children}</Suspense>

// Customer pages wrapper - same Navbar/Footer, just adds container + auth guard
function CustomerLayout() {
  return (
    <ProtectedRoute>
      <RoleBasedRoute allowedRoles={['customer']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </div>
      </RoleBasedRoute>
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      // Public routes
      { path: '/', element: <Home /> },
      { path: '/categories', element: <S><Categories /></S> },
      { path: '/products', element: <S><Products /></S> },
      { path: '/products/:id', element: <S><ProductDetail /></S> },
      { path: '/plans', element: <S><Plans /></S> },
      { path: '/plans/:id', element: <S><PlanDetail /></S> },
      { path: '/vendors', element: <S><VendorsList /></S> },
      { path: '/vendors/:slug', element: <S><VendorDetail /></S> },
      { path: '/about', element: <S><About /></S> },
      { path: '/contact', element: <S><Contact /></S> },

      // Customer routes (inside PublicLayout with Navbar + Footer)
      {
        element: <CustomerLayout />,
        children: [
          { path: '/customer/dashboard', element: <S><CustomerDashboard /></S> },
          { path: '/customer/cart', element: <S><CustomerCart /></S> },
          { path: '/customer/checkout', element: <S><CustomerCheckout /></S> },
          { path: '/customer/orders', element: <S><CustomerOrders /></S> },
          { path: '/customer/orders/:id', element: <S><CustomerOrderDetail /></S> },
          { path: '/customer/addresses', element: <S><CustomerAddresses /></S> },
          { path: '/customer/subscriptions', element: <S><CustomerSubscriptions /></S> },
          { path: '/customer/subscriptions/:id', element: <S><CustomerSubscriptionDetail /></S> },
          { path: '/customer/subscribe/:planId', element: <S><Subscribe /></S> },
          { path: '/customer/wallet', element: <S><CustomerWallet /></S> },
          { path: '/customer/profile', element: <S><CustomerProfile /></S> },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },

  // Auth (standalone)
  { path: '/login', element: <S><Login /></S> },
  { path: '/signup', element: <S><Signup /></S> },

  // Seller Onboarding (standalone)
  {
    path: '/seller/onboarding',
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['seller']}>
          <S><SellerOnboarding /></S>
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
  },

  // Seller Panel (DashboardLayout with sidebar)
  {
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['seller']}>
          <DashboardLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: '/seller/dashboard', element: <S><SellerDashboard /></S> },
      { path: '/seller/menu', element: <S><SellerMenuManagement /></S> },
      { path: '/seller/plans', element: <S><SellerPlansManagement /></S> },
      { path: '/seller/orders', element: <S><SellerOrders /></S> },
      { path: '/seller/subscriptions', element: <S><SellerSubscribers /></S> },
      { path: '/seller/earnings', element: <S><SellerEarnings /></S> },
      { path: '/seller/settings', element: <S><SellerSettings /></S> },
    ],
  },

  // Admin Panel (DashboardLayout with sidebar)
  {
    element: (
      <ProtectedRoute>
        <RoleBasedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </RoleBasedRoute>
      </ProtectedRoute>
    ),
    children: [
      { path: '/admin/dashboard', element: <S><AdminDashboard /></S> },
      { path: '/admin/sellers', element: <S><SellersManagement /></S> },
      { path: '/admin/users', element: <S><UsersManagement /></S> },
      { path: '/admin/orders', element: <S><AdminOrders /></S> },
      { path: '/admin/subscriptions', element: <S><AdminSubscriptions /></S> },
      { path: '/admin/reports', element: <S><Reports /></S> },
      { path: '/admin/contacts', element: <S><ContactMessages /></S> },
    ],
  },
])

export default router
