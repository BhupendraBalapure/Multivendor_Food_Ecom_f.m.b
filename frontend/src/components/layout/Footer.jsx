import { Link } from 'react-router-dom'
import { ChefHat } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1c1917] dark:bg-zinc-900 text-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="h-8 w-8 text-orange-400" />
              <span className="text-xl font-bold text-white">
                Meals<span className="text-orange-400">OnTime</span>
              </span>
            </div>
            <p className="text-zinc-400 text-sm">
              Your daily meal subscription platform. Fresh homemade food delivered every day.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Browse</h3>
            <div className="space-y-2 text-sm text-zinc-400">
              <Link to="/products" className="block hover:text-orange-400 transition-colors">All Dishes</Link>
              <Link to="/categories" className="block hover:text-orange-400 transition-colors">Categories</Link>
              <Link to="/plans" className="block hover:text-orange-400 transition-colors">Subscription Plans</Link>
              <Link to="/vendors" className="block hover:text-orange-400 transition-colors">All Kitchens</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
            <div className="space-y-2 text-sm text-zinc-400">
              <Link to="/vendors" className="block hover:text-orange-400 transition-colors">Browse Kitchens</Link>
              <Link to="/about" className="block hover:text-orange-400 transition-colors">About Us</Link>
              <Link to="/contact" className="block hover:text-orange-400 transition-colors">Contact</Link>
            </div>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-semibold mb-4 text-white">For Sellers</h3>
            <div className="space-y-2 text-sm text-zinc-400">
              <Link to="/signup?role=seller" className="block hover:text-orange-400 transition-colors">Register as Seller</Link>
              <Link to="/seller/dashboard" className="block hover:text-orange-400 transition-colors">Seller Dashboard</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-700/50 mt-8 pt-8 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} MealsOnTime. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
