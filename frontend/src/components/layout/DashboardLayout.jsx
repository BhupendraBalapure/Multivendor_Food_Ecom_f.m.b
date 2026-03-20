import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '@/store/slices/authSlice'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, CalendarCheck, MapPin, Wallet,
  UserCircle, ChefHat, UtensilsCrossed, ClipboardList, Users,
  Store, BarChart3, Settings, LogOut, Menu, X, CreditCard, MessageSquare,
  Sun, Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import NotificationBell from '@/components/common/NotificationBell'
import useTheme from '@/hooks/useTheme'

const menuItems = {
  customer: [
    { label: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Orders', path: '/customer/orders', icon: ShoppingBag },
    { label: 'Subscriptions', path: '/customer/subscriptions', icon: CalendarCheck },
    { label: 'Addresses', path: '/customer/addresses', icon: MapPin },
    { label: 'Wallet', path: '/customer/wallet', icon: Wallet },
    { label: 'Profile', path: '/customer/profile', icon: UserCircle },
  ],
  seller: [
    { label: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
    { label: 'Menu', path: '/seller/menu', icon: UtensilsCrossed },
    { label: 'Plans', path: '/seller/plans', icon: CreditCard },
    { label: 'Orders', path: '/seller/orders', icon: ClipboardList },
    { label: 'Subscribers', path: '/seller/subscriptions', icon: CalendarCheck },
    { label: 'Earnings', path: '/seller/earnings', icon: Wallet },
    { label: 'Settings', path: '/seller/settings', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Sellers', path: '/admin/sellers', icon: Store },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: CalendarCheck },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Messages', path: '/admin/contacts', icon: MessageSquare },
  ],
}

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const { pathname } = location
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const items = menuItems[user?.role] || []
  const roleLabel = { customer: 'Customer', seller: 'Seller', admin: 'Admin' }

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-bold">MealsOnTime</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-7 w-7 text-primary" />
                <span className="text-lg font-bold">MealsOnTime</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={isDark ? 'Light mode' : 'Dark mode'}>
                  {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </button>
                <button className="lg:hidden p-1.5" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{roleLabel[user?.role]} Panel</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
