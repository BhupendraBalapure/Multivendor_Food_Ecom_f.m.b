import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logoutUser } from '@/store/slices/authSlice'
import { selectCartItemCount } from '@/store/slices/cartSlice'
import {
  ShoppingCart, User, LogOut, Menu, X, ChefHat, Sun, Moon,
  ShoppingBag, CalendarCheck, Wallet, MapPin, UserCircle, ChevronDown,
  LayoutDashboard, UtensilsCrossed, BarChart3, Users, Settings
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useTheme from '@/hooks/useTheme'
import SearchBar from '@/components/ui/SearchBar'

const CUSTOMER_LINKS = [
  { to: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/customer/subscriptions', label: 'Subscriptions', icon: CalendarCheck },
  { to: '/customer/wallet', label: 'Wallet', icon: Wallet },
  { to: '/customer/addresses', label: 'Addresses', icon: MapPin },
  { to: '/customer/profile', label: 'Profile', icon: UserCircle },
]

const SELLER_LINKS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/seller/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/seller/earnings', label: 'Earnings', icon: BarChart3 },
  { to: '/seller/settings', label: 'Settings', icon: Settings },
]

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/sellers', label: 'Sellers', icon: ChefHat },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

function getRoleLinks(role) {
  if (role === 'seller') return SELLER_LINKS
  if (role === 'admin') return ADMIN_LINKS
  return CUSTOMER_LINKS
}

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const cartCount = useSelector(selectCartItemCount)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const profileRef = useRef(null)

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    setProfileOpen(false)
    setMobileOpen(false)
    navigate('/')
  }

  const roleLinks = user ? getRoleLinks(user.role) : []
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <nav className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Meals<span className="text-primary">OnTime</span>
            </span>
          </Link>

          {/* Center - Search bar (desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <SearchBar />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { to: '/products', label: 'Menu' },
              { to: '/plans', label: 'Plans' },
              { to: '/vendors', label: 'Kitchens' },
              { to: '/about', label: 'About' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3 ml-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Cart (customer only) */}
                {user?.role === 'customer' && (
                  <Link to="/customer/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border border-border shadow-xl py-2 animate-fade-in-up">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-semibold text-sm text-foreground truncate">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize font-medium">
                          {user?.role}
                        </span>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        {roleLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <link.icon className="h-4 w-4 text-muted-foreground" />
                            {link.label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-border pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Theme toggle (mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              className="p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-16 space-y-1 animate-fade-in-up max-h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-900">
            {/* User info at top */}
            {isAuthenticated && (
              <div className="mx-1 mb-3 p-3 bg-muted/40 rounded-xl flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize font-medium shrink-0">
                  {user?.role}
                </span>
              </div>
            )}

            {/* Mobile search */}
            <div className="px-1 pb-2">
              <SearchBar onSearchDone={() => setMobileOpen(false)} />
            </div>

            <div className="border-t border-border my-1" />

            {/* Nav links */}
            {[
              { to: '/products', label: 'Menu' },
              { to: '/plans', label: 'Plans' },
              { to: '/vendors', label: 'Kitchens' },
              { to: '/about', label: 'About' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 font-medium rounded-lg transition-colors ${isActive ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-muted/50'}`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <div className="border-t border-border my-1" />

                {/* Role links */}
                {roleLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 px-3 py-2.5 text-foreground hover:text-primary rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </Link>
                ))}

                <div className="border-t border-border my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-destructive font-medium rounded-lg hover:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-border my-1" />
                <div className="flex gap-3 px-1 pt-1">
                  <Link to="/login" className="flex-1 text-center px-4 py-2.5 border border-border rounded-xl text-sm font-medium" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link to="/signup" className="flex-1 text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium" onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
