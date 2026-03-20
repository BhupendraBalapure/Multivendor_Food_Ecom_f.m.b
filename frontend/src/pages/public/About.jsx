import { Link } from 'react-router-dom'
import {
  ChefHat, Users, Utensils, Heart, Shield, Clock, ArrowRight,
  Leaf, Star, Truck, Smartphone, IndianRupee, CalendarCheck
} from 'lucide-react'

const VALUES = [
  { icon: Heart, title: 'Home-Cooked Goodness', desc: 'Every meal is freshly prepared by local home kitchens and mess services with love and care.', color: 'text-rose-500 bg-rose-500/10' },
  { icon: Shield, title: 'Quality Assured', desc: 'All our partner kitchens follow strict hygiene standards. Your health is our priority.', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Clock, title: 'Always On Time', desc: 'Reliable daily deliveries so you never have to worry about your next meal.', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Users, title: 'Community First', desc: 'We empower local food entrepreneurs and connect them with customers who value home food.', color: 'text-emerald-500 bg-emerald-500/10' },
  { icon: Leaf, title: 'Fresh & Healthy', desc: 'No preservatives, no artificial flavors. Just pure, nutritious homestyle cooking every day.', color: 'text-green-500 bg-green-500/10' },
  { icon: IndianRupee, title: 'Affordable Pricing', desc: 'Subscription plans that save you money. Eat better for less than eating out.', color: 'text-purple-500 bg-purple-500/10' },
]

const STATS = [
  { num: '50+', label: 'Menu Items', icon: Utensils },
  { num: '5+', label: 'Partner Kitchens', icon: ChefHat },
  { num: '100+', label: 'Happy Customers', icon: Users },
  { num: '14+', label: 'Subscription Plans', icon: CalendarCheck },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse Kitchens', desc: 'Explore local home kitchens, mess services, and tiffin providers in your area.', icon: Smartphone },
  { step: '02', title: 'Choose a Plan', desc: 'Pick a subscription plan that fits your schedule and budget — breakfast, lunch, dinner, or all meals.', icon: CalendarCheck },
  { step: '03', title: 'Daily Delivery', desc: 'Sit back and enjoy freshly prepared homemade meals delivered to your doorstep every day.', icon: Truck },
]

export default function About() {
  return (
    <div className="min-h-screen">
      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff7ed] via-[#fed7aa] to-[#fb923c] dark:from-[#18181b] dark:via-[#27272a] dark:to-[#fb923c]/15">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/20 dark:bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-400/15 dark:bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-orange-800 dark:text-orange-300 mb-6 border border-orange-200/50 dark:border-white/10">
              <ChefHat className="h-4 w-4" />
              Homemade meals, delivered daily
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-orange-950 dark:text-white mb-6 leading-tight">
              About Meals<span className="text-primary">OnTime</span>
            </h1>
            <p className="text-lg md:text-xl text-orange-800/70 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              A multi-vendor food subscription platform connecting local mess owners, tiffin services,
              and home kitchens with customers looking for daily homemade meals.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                to="/vendors"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
              >
                Explore Kitchens <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/70 dark:bg-white/10 backdrop-blur-sm text-orange-900 dark:text-white rounded-xl font-medium hover:bg-white/90 dark:hover:bg-white/20 transition-all border border-orange-200/50 dark:border-white/10"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== STATS BAR ====== */}
      <section className="relative -mt-8 z-10 px-4">
        <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{s.num}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== MISSION ====== */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              <Star className="h-4 w-4 fill-primary" /> Our Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              Making homemade food <br className="hidden md:block" />
              <span className="text-primary">accessible to everyone</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              We believe everyone deserves access to healthy, homemade food. Whether you're a working
              professional, a student, or anyone who wants hassle-free daily meals — MealsOnTime has
              you covered.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              For sellers, we provide a platform to reach more customers, manage subscriptions,
              and grow their food business with ease. No commissions on subscriptions, just a
              simple, transparent platform fee.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Daily fresh meals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Easy management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Fast payouts</span>
              </div>
            </div>
          </div>

          {/* Illustration grid */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl" />
            <div className="grid grid-cols-2 gap-5 p-4">
              <div className="space-y-5">
                <div
                  className="snake-border"
                  style={{ '--snake-color': '#f97316', '--snake-delay': '0s' }}
                >
                  <div className="relative bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-500/10 dark:to-orange-500/5 rounded-[calc(1rem-2px)] p-6 m-[2px]">
                    <ChefHat className="h-8 w-8 text-primary mb-3" />
                    <p className="font-semibold text-lg">For Sellers</p>
                    <p className="text-sm text-muted-foreground mt-1">Grow your home kitchen business with our platform</p>
                  </div>
                </div>
                <div
                  className="snake-border"
                  style={{ '--snake-color': '#3b82f6', '--snake-delay': '1.5s' }}
                >
                  <div className="relative bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-[calc(1rem-2px)] p-6 m-[2px]">
                    <CalendarCheck className="h-8 w-8 text-blue-500 mb-3" />
                    <p className="font-semibold text-lg">Subscriptions</p>
                    <p className="text-sm text-muted-foreground mt-1">Flexible daily, weekly, and monthly plans</p>
                  </div>
                </div>
              </div>
              <div className="space-y-5 pt-8">
                <div
                  className="snake-border"
                  style={{ '--snake-color': '#10b981', '--snake-delay': '0.75s' }}
                >
                  <div className="relative bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-[calc(1rem-2px)] p-6 m-[2px]">
                    <Truck className="h-8 w-8 text-emerald-500 mb-3" />
                    <p className="font-semibold text-lg">Delivery</p>
                    <p className="text-sm text-muted-foreground mt-1">Reliable on-time delivery to your doorstep</p>
                  </div>
                </div>
                <div
                  className="snake-border"
                  style={{ '--snake-color': '#a855f7', '--snake-delay': '2.25s' }}
                >
                  <div className="relative bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/5 rounded-[calc(1rem-2px)] p-6 m-[2px]">
                    <IndianRupee className="h-8 w-8 text-purple-500 mb-3" />
                    <p className="font-semibold text-lg">Wallet</p>
                    <p className="text-sm text-muted-foreground mt-1">Easy payments with built-in digital wallet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="bg-muted/30 dark:bg-muted/10 py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Simple Process
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Getting your daily homemade meals is as easy as 1-2-3
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative group">
                <div className="bg-card rounded-2xl border border-border p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary/50 uppercase tracking-widest mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                {/* Connector arrow */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== VALUES ====== */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-24">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Our Values
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">What We Stand For</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            The principles that guide everything we do at MealsOnTime
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="group bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${v.color} mb-4 group-hover:scale-110 transition-transform`}>
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="px-4 pb-20 md:pb-24">
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 dark:from-primary dark:to-orange-700 p-10 md:p-16 text-center">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to taste homemade?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Join thousands of happy customers enjoying daily homemade meals from trusted local kitchens.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                to="/vendors"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                Browse Kitchens <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/15 text-white rounded-xl font-semibold hover:bg-white/25 transition-all border border-white/20"
              >
                Register as Seller
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
