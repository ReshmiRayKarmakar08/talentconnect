import { useEffect, useState } from 'react'
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  Loader2, Plus, ArrowUpCircle, X, CheckCircle2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { getApiErrorMessage, paymentsAPI } from '../utils/api'

const ensureRazorpayLoaded = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function WalletPage() {
  const { user } = useAuthStore()
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_spent: 0 })
  const [transactions, setTransactions] = useState([])
  const [walletLoading, setWalletLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  // Top Up Modal State
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState(100)
  const [contactNumber, setContactNumber] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [upiOrAccount, setUpiOrAccount] = useState('')
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  // Filter
  const [filterType, setFilterType] = useState('all')

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TsDJgBLQkSlnbR'

  const fetchWalletData = async () => {
    try {
      const [walletRes, txnsRes] = await Promise.all([
        paymentsAPI.wallet(),
        paymentsAPI.transactions(),
      ])
      if (walletRes.data) setWallet(walletRes.data)
      if (txnsRes.data) setTransactions(txnsRes.data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update wallet data'))
    } finally {
      setWalletLoading(false)
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [])

  // Handle Top-Up via Razorpay
  const handleTopup = async () => {
    const amountNum = parseFloat(topupAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid top-up amount')
      return
    }

    setTopupLoading(true)
    try {
      const isLoaded = await ensureRazorpayLoaded()
      if (!isLoaded || !window.Razorpay) {
        toast.error('Razorpay on-site checkout could not be loaded. Please check your internet connection.')
        setTopupLoading(false)
        return
      }

      const { data: order } = await paymentsAPI.topupOrder({ amount: amountNum })

      const logoUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/logo.png`
        : 'https://talentconnect-web.vercel.app/logo.png'

      const options = {
        key: order.key_id || razorpayKeyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'TalentConnect',
        description: `Wallet Top-Up (₹${amountNum})`,
        image: logoUrl,
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
          contact: contactNumber.trim() || user?.phone || '9999999999',
        },
        theme: {
          color: '#4f52e5',
        },
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying payment with bank...')
          try {
            const { data: updatedWallet } = await paymentsAPI.topupVerify({
              razorpay_order_id: response.razorpay_order_id || order.order_id || '',
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || '',
              amount: amountNum,
            })
            setWallet(updatedWallet)
            toast.success(`Successfully added ₹${amountNum.toFixed(2)} to your wallet!`, { id: verifyToast })
            setShowTopupModal(false)
            fetchWalletData()
          } catch (vErr) {
            toast.error(getApiErrorMessage(vErr, 'Payment verification failed'), { id: verifyToast })
          }
        },
        modal: {
          ondismiss: () => {
            setTopupLoading(false)
          },
        },
      }

      // Only pass order_id if it's an authentic server-created Razorpay order
      if (
        order.order_id &&
        order.order_id.startsWith('order_') &&
        !order.order_id.startsWith('order_test_') &&
        !order.order_id.startsWith('test_order_')
      ) {
        options.order_id = order.order_id
      }

      try {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (response) => {
          const desc = response.error?.description || 'Payment cancelled or failed'
          toast.error(desc)
          setTopupLoading(false)
        })
        rzp.open()
      } catch (rzpErr) {
        toast.error('Could not launch Razorpay modal: ' + (rzpErr?.message || 'Check key configuration'))
        setTopupLoading(false)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to initiate Razorpay order'))
    } finally {
      setTopupLoading(false)
    }
  }

  // Handle Withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault()
    const amountNum = parseFloat(withdrawAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount to withdraw')
      return
    }

    if (amountNum > wallet.balance) {
      toast.error(`Amount exceeds available balance (₹${wallet.balance.toFixed(2)})`)
      return
    }

    if (!upiOrAccount.trim()) {
      toast.error('Please enter your UPI ID or Bank Account Details')
      return
    }

    setWithdrawLoading(true)
    const toastId = toast.loading('Processing withdrawal request...')
    try {
      const { data: updatedWallet } = await paymentsAPI.withdraw({
        amount: amountNum,
        upi_or_account: upiOrAccount.trim(),
        notes: withdrawNotes.trim() || undefined,
      })

      setWallet(updatedWallet)
      toast.success(`Withdrawal of ₹${amountNum.toFixed(2)} initiated to ${upiOrAccount.trim()}!`, { id: toastId })
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setUpiOrAccount('')
      setWithdrawNotes('')
      fetchWalletData()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Withdrawal request failed'), { id: toastId })
    } finally {
      setWithdrawLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'credit') return t.transaction_type === 'credit'
    if (filterType === 'debit') return t.transaction_type === 'debit'
    return true
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-slide-up max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header text-2xl sm:text-3xl font-bold">Wallet & Payments</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Manage funds, on-site Razorpay top-ups, and bank withdrawals</p>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 sm:px-4 py-2.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <ArrowUpCircle size={15} className="text-red-400 shrink-0" />
            Withdraw
          </button>
          <button
            onClick={() => setShowTopupModal(true)}
            className="btn-primary flex items-center gap-2 text-xs font-semibold py-2.5 px-3.5 sm:px-4"
          >
            <Plus size={15} className="shrink-0" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {/* Available Balance Card */}
        <div className="card p-5 sm:p-6 md:col-span-2 xl:col-span-1 bg-gradient-to-br from-brand-950 via-[#13172e] to-surface-card border-brand-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between min-w-0">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Available Balance</p>
              <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-brand-300">
                Live Wallet
              </span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white font-display mt-1 break-words">
              ₹{wallet.balance?.toFixed(2) || '0.00'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300 font-medium">
                <CheckCircle2 size={12} className="shrink-0" />
                <span>Welcome bonus ₹50 active</span>
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              On-Site Gateway
            </span>
            <span className="text-[11px] font-medium text-brand-300 bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 rounded-full">
              Razorpay Secured
            </span>
          </div>
        </div>

        {/* Total Earned Card */}
        <div className="card p-5 sm:p-6 flex items-center gap-3.5 sm:gap-4 border-white/10 hover:border-white/15 transition-colors min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold truncate">Total Earned</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 font-display mt-0.5 truncate">
              ₹{wallet.total_earned?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1 truncate">From mentoring & tasks</p>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="card p-5 sm:p-6 flex items-center gap-3.5 sm:gap-4 border-white/10 hover:border-white/15 transition-colors min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <TrendingDown size={22} className="text-red-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold truncate">Total Spent / Withdrawn</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-400 font-display mt-0.5 truncate">
              ₹{wallet.total_spent?.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500 mt-1 truncate">Sessions, tasks & payouts</p>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="card overflow-hidden border-white/10">
        <div className="px-6 py-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="section-title">Transaction History</h2>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'all' ? 'bg-brand-600 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('credit')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'credit' ? 'bg-emerald-600/80 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
              >
                Credits (+)
              </button>
              <button
                onClick={() => setFilterType('debit')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'debit' ? 'bg-red-600/80 text-white font-medium' : 'text-gray-400 hover:text-white'}`}
              >
                Debits (-)
              </button>
            </div>
          </div>
          {transactionsLoading && <Loader2 className="animate-spin text-brand-400" size={18} />}
        </div>

        {transactionsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-400" size={24} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-14 text-center">
            <Wallet size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-medium text-sm">No transactions found</p>
            <p className="text-gray-500 text-xs mt-1">Add funds or book mentoring sessions to see activity</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {filteredTransactions.map((txn) => {
              const isCredit = txn.transaction_type === 'credit'
              return (
                <div key={txn.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200 truncate">{txn.description}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                        <span>{new Date(txn.created_at).toLocaleString()}</span>
                        {txn.reference_id && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-mono text-[11px] text-gray-400 truncate max-w-[180px]">Ref: {txn.reference_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="self-end sm:self-auto shrink-0">
                    <span className={`font-bold text-sm sm:text-base ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL: TOP-UP VIA RAZORPAY ─────────────────────────── */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-md border-brand-500/30 bg-[#121624] shadow-2xl relative">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Add Money to Wallet</h3>
                <p className="text-xs text-gray-400">Instant top-up powered by Razorpay</p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <label className="label">Select or Enter Amount (₹)</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopupAmount(preset)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        topupAmount === preset
                          ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="input pl-8"
                    placeholder="Enter custom amount"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">Phone Number</label>
                  <span className="text-[10px] text-gray-500 font-normal">Optional</span>
                </div>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="input"
                  placeholder="e.g. 9876543210 (optional)"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Selected Amount:</span>
                  <span className="font-bold text-white">₹{parseFloat(topupAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Gateway:</span>
                  <span className="font-medium text-brand-300">Razorpay (UPI / Cards / Netbanking)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                disabled={topupLoading || !topupAmount || parseFloat(topupAmount) <= 0}
                onClick={handleTopup}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {topupLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Pay ₹{parseFloat(topupAmount || 0).toFixed(2)} via Razorpay
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mt-1">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>On-site Razorpay gateway • Instant wallet credit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: WITHDRAW FUNDS ──────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 w-full max-w-md border-red-500/20 bg-[#121624] shadow-2xl relative">
            <button
              onClick={() => setShowWithdrawModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <ArrowUpCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Withdraw Funds</h3>
                <p className="text-xs text-gray-400">Transfer earnings to your UPI or Bank</p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4 my-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label mb-0">Amount to Withdraw (₹)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(wallet.balance.toFixed(2))}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300"
                  >
                    Max (₹{wallet.balance.toFixed(2)})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet.balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input pl-8"
                    placeholder="Enter withdrawal amount"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">UPI ID or Bank Details</label>
                <input
                  type="text"
                  value={upiOrAccount}
                  onChange={(e) => setUpiOrAccount(e.target.value)}
                  className="input"
                  placeholder="e.g. name@oksbi, name@paytm, or A/C + IFSC"
                  required
                />
              </div>

              <div>
                <label className="label">Remarks / Note (Optional)</label>
                <input
                  type="text"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  className="input"
                  placeholder="e.g. Monthly peer tutoring payout"
                />
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/80 flex items-start gap-2">
                <AlertCircle size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                <span>
                  Withdrawal requests are processed to your provided UPI/Bank account. Available balance: ₹{wallet.balance.toFixed(2)}.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn-secondary flex-1 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > wallet.balance}
                  className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5"
                >
                  {withdrawLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
