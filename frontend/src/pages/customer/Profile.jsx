import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCurrentUser } from '@/store/slices/authSlice'
import authApi from '@/api/authApi'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '@/store/slices/authSlice'
import { User, Mail, Phone, Lock, Loader2, Trash2, AlertTriangle } from 'lucide-react'

export default function CustomerProfile() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [saving, setSaving] = useState(false)

  const [pwForm, setPwForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [changingPw, setChangingPw] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe(form)
      await dispatch(fetchCurrentUser()).unwrap()
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm')
      return
    }
    setDeleting(true)
    try {
      await authApi.deleteAccount({ password: deletePassword })
      toast.success('Account deleted successfully')
      dispatch(logoutUser())
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.password?.[0] || err.response?.data?.detail || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPw(true)
    try {
      await authApi.changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      toast.success('Password changed successfully')
      setPwForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to change password'
      toast.error(msg)
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Profile</h1>
      <p className="text-muted-foreground mb-6">Manage your account details</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.full_name} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
            </div>
            <h2 className="text-lg font-semibold">{user?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-auto font-medium">{user?.is_email_verified ? 'Verified' : 'Not verified'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-auto font-medium">{user?.phone || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Profile */}
          <form onSubmit={handleUpdateProfile} className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Update Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" /> Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Current Password</label>
                <input
                  type="password"
                  value={pwForm.old_password}
                  onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">New Password</label>
                <input
                  type="password"
                  value={pwForm.new_password}
                  onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm_password}
                  onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={changingPw}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {changingPw && <Loader2 className="h-4 w-4 animate-spin" />}
              Change Password
            </button>
          </form>

          {/* Delete Account */}
          <div className="bg-card rounded-xl border border-destructive/30 p-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Account
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, all your data will be permanently removed. This action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Confirm Account Deletion</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Enter your password to confirm:</p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Yes, Delete Account
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
