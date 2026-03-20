import { useState, useEffect, useRef } from 'react'
import sellerApi from '@/api/sellerApi'
import { toast } from 'sonner'
import { mediaUrl } from '@/utils/constants'
import {
  Store, MapPin, FileText, Clock, Camera, ImageIcon,
  Loader2, Wifi, WifiOff, Save
} from 'lucide-react'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SellerSettings() {
  const [profile, setProfile] = useState(null)
  const [operatingDays, setOperatingDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingDays, setSavingDays] = useState(false)
  const [toggling, setToggling] = useState(false)

  const [form, setForm] = useState({
    kitchen_name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, daysRes] = await Promise.all([
        sellerApi.getProfile(),
        sellerApi.getOperatingDays(),
      ])
      const p = profileRes.data
      setProfile(p)
      setForm({
        kitchen_name: p.kitchen_name || '',
        description: p.description || '',
        address: p.address || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        phone: p.phone || '',
      })

      // Initialize operating days (ensure all 7 days exist)
      const existing = daysRes.data || []
      const days = DAY_NAMES.map((_, i) => {
        const found = existing.find((d) => d.day_of_week === i)
        return { day_of_week: i, is_open: found ? found.is_open : i < 6 } // default: Mon-Sat open
      })
      setOperatingDays(days)
    } catch (err) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined) formData.append(key, val)
      })
      const res = await sellerApi.updateProfile(formData)
      setProfile(res.data)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (field, file) => {
    if (!file) return
    const formData = new FormData()
    formData.append(field, file)
    try {
      const res = await sellerApi.updateProfile(formData)
      setProfile(res.data)
      toast.success(`${field === 'logo' ? 'Logo' : 'Banner'} updated!`)
    } catch (err) {
      toast.error('Failed to upload image')
    }
  }

  const handleUpdateDays = async () => {
    setSavingDays(true)
    try {
      const res = await sellerApi.updateOperatingDays(operatingDays)
      setOperatingDays(res.data.map((d) => ({ day_of_week: d.day_of_week, is_open: d.is_open })))
      toast.success('Operating days updated')
    } catch (err) {
      toast.error('Failed to update operating days')
    } finally {
      setSavingDays(false)
    }
  }

  const handleToggleOnline = async () => {
    setToggling(true)
    try {
      const res = await sellerApi.toggleOnline()
      setProfile((prev) => ({ ...prev, is_online: res.data.is_online }))
      toast.success(res.data.detail)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to toggle status')
    } finally {
      setToggling(false)
    }
  }

  const toggleDay = (dayIndex) => {
    setOperatingDays((prev) =>
      prev.map((d) => d.day_of_week === dayIndex ? { ...d, is_open: !d.is_open } : d)
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your kitchen settings</p>

      <div className="space-y-6">
        {/* Online Status Toggle */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.is_online ? (
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <WifiOff className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="font-semibold">Online Status</h2>
                <p className="text-sm text-muted-foreground">
                  {profile?.is_online ? 'You are accepting orders' : 'You are currently offline'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={toggling || profile?.approval_status !== 'approved'}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                profile?.is_online ? 'bg-green-500' : 'bg-gray-300'
              } ${profile?.approval_status !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-6 w-6 bg-white rounded-full shadow transition-transform ${
                profile?.is_online ? 'translate-x-7' : ''
              }`} />
            </button>
          </div>
          {profile?.approval_status !== 'approved' && (
            <p className="text-xs text-yellow-600 mt-2">Your profile must be approved before you can go online.</p>
          )}
        </div>

        {/* Logo & Banner */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5" /> Logo & Banner
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Kitchen Logo</label>
              <div className="relative group">
                {profile?.logo ? (
                  <img src={mediaUrl(profile.logo)} alt="Logo" className="h-24 w-24 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="h-24 w-24 rounded-xl bg-muted flex items-center justify-center border border-border">
                    <Store className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute inset-0 h-24 w-24 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('logo', e.target.files[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Banner Image</label>
              <div className="relative group">
                {profile?.banner_image ? (
                  <img src={mediaUrl(profile.banner_image)} alt="Banner" className="h-24 w-full rounded-xl object-cover border border-border" />
                ) : (
                  <div className="h-24 w-full rounded-xl bg-muted flex items-center justify-center border border-border">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('banner_image', e.target.files[0])} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Profile */}
        <form onSubmit={handleUpdateProfile} className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Store className="h-5 w-5" /> Kitchen Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Kitchen Name</label>
              <input
                type="text"
                value={form.kitchen_name}
                onChange={(e) => setForm({ ...form, kitchen_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                maxLength={6}
              />
            </div>
          </div>

          {/* FSSAI Info (read-only) */}
          {profile?.fssai_license && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">FSSAI License: <span className="font-medium text-foreground">{profile.fssai_license}</span></span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </form>

        {/* Operating Days */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Operating Days
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Select the days your kitchen is open for orders</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {operatingDays.map((day) => (
              <button
                key={day.day_of_week}
                type="button"
                onClick={() => toggleDay(day.day_of_week)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  day.is_open
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground'
                }`}
              >
                <p className="text-sm font-medium">{DAY_NAMES[day.day_of_week]?.slice(0, 3)}</p>
                <p className="text-xs mt-1">{day.is_open ? 'Open' : 'Closed'}</p>
              </button>
            ))}
          </div>
          <button
            onClick={handleUpdateDays}
            disabled={savingDays}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {savingDays ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Operating Days
          </button>
        </div>
      </div>
    </div>
  )
}
