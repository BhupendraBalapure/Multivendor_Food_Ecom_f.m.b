import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import walletApi from '@/api/walletApi'
import paymentApi from '@/api/paymentApi'
import { formatCurrency } from '@/utils/formatters'
import {
  Wallet as WalletIcon, Loader2, Plus, ArrowDownLeft, ArrowUpRight,
  IndianRupee, RefreshCw, Filter
} from 'lucide-react'
import { toast } from 'sonner'

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID

const REASON_LABELS = {
  recharge: 'Wallet Recharge',
  order_payment: 'Order Payment',
  refund: 'Refund',
  subscription_refund: 'Subscription Refund',
  cashback: 'Cashback',
  admin_credit: 'Admin Credit',
}

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000]

export default function Wallet() {
  const { user } = useSelector((state) => state.auth)
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [rechargeModal, setRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [recharging, setRecharging] = useState(false)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    fetchBalance()
    fetchTransactions()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchTransactions(1)
  }, [filter])

  const fetchBalance = async () => {
    try {
      const res = await walletApi.getBalance()
      setBalance(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (p = 1) => {
    setTxLoading(true)
    try {
      const params = { page: p }
      if (filter) params.type = filter
      const res = await walletApi.getTransactions(params)
      const data = res.data.results || res.data
      if (p === 1) {
        setTransactions(data)
      } else {
        setTransactions((prev) => [...prev, ...data])
      }
      setHasNext(!!res.data.next)
    } catch (err) {
      console.error(err)
    } finally {
      setTxLoading(false)
    }
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchTransactions(next)
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount)
    if (!amount || amount < 1) return
    setRecharging(true)

    try {
      const res = await walletApi.recharge({ amount })

      const loaded = await loadRazorpay()
      if (!loaded) {
        toast.error('Failed to load payment gateway.')
        setRecharging(false)
        return
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: res.data.amount,
        currency: 'INR',
        name: 'MealsOnTime',
        description: 'Wallet Recharge',
        order_id: res.data.razorpay_order_id,
        handler: async (response) => {
          try {
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            setRechargeModal(false)
            setRechargeAmount('')
            fetchBalance()
            fetchTransactions(1)
            setPage(1)
          } catch (err) {
            toast.error('Payment verification failed. Contact support.')
          } finally {
            setRecharging(false)
          }
        },
        prefill: { name: user?.full_name, email: user?.email, contact: user?.phone },
        modal: { ondismiss: () => setRecharging(false) },
        theme: { color: '#f97316' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Recharge failed.')
      setRecharging(false)
    }
  }

  const formatTxDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTxTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Wallet</h1>
      <p className="text-muted-foreground mb-6">Manage your wallet balance and transactions</p>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-orange-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Available Balance</p>
            <p className="text-4xl font-bold mt-1">{formatCurrency(balance?.balance || 0)}</p>
          </div>
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
            <WalletIcon className="h-8 w-8" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setRechargeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Money
          </button>
          <button
            onClick={() => { fetchBalance(); fetchTransactions(1); setPage(1) }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Transaction History</h3>
          <div className="flex gap-1.5">
            {[
              { value: '', label: 'All' },
              { value: 'credit', label: 'Credits' },
              { value: 'debit', label: 'Debits' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 && !txLoading ? (
          <div className="text-center py-12">
            <IndianRupee className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                    tx.transaction_type === 'credit'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.transaction_type === 'credit'
                      ? <ArrowDownLeft className="h-4 w-4" />
                      : <ArrowUpRight className="h-4 w-4" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium">{REASON_LABELS[tx.reason] || tx.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTxDate(tx.created_at)} at {formatTxTime(tx.created_at)}
                      {tx.reference_id && <span> &bull; {tx.reference_id}</span>}
                    </p>
                    {tx.description && <p className="text-xs text-muted-foreground mt-0.5">{tx.description}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Bal: {formatCurrency(tx.balance_after)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {txLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {hasNext && !txLoading && (
          <div className="p-4 text-center border-t border-border">
            <button
              onClick={loadMore}
              className="text-sm text-primary font-medium hover:underline"
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Recharge Modal */}
      {rechargeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-1">Add Money to Wallet</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose or enter an amount to recharge via Razorpay.</p>

            {/* Quick amounts */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setRechargeAmount(String(amt))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    rechargeAmount === String(amt)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRechargeModal(false); setRechargeAmount('') }}
                className="px-4 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleRecharge}
                disabled={!rechargeAmount || parseFloat(rechargeAmount) < 1 || recharging}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {recharging ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><Plus className="h-4 w-4" /> Add {rechargeAmount ? formatCurrency(parseFloat(rechargeAmount)) : 'Money'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
