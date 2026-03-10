import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiErrorMessage, paymentsAPI } from '../utils/api'

export default function WalletPage() {
  const [wallet, setWallet] = useState({ balance: 0, total_earned: 0, total_spent: 0 })
  const [transactions, setTransactions] = useState([])
  const [walletLoading, setWalletLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(true)

  useEffect(() => {
    let active = true

    paymentsAPI.wallet()
      .then(({ data }) => {
        if (active && data) setWallet(data)
      })
      .catch((error) => {
        if (!active) return
        toast.error(getApiErrorMessage(error, 'Failed to load wallet summary'))
      })
      .finally(() => {
        if (active) setWalletLoading(false)
      })

    paymentsAPI.transactions()
      .then(({ data }) => {
        if (active) setTransactions(data || [])
      })
      .catch((error) => {
        if (!active) return
        setTransactions([])
        toast.error(getApiErrorMessage(error, 'Failed to load transactions'))
      })
      .finally(() => {
        if (active) setTransactionsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="p-8 animate-slide-up">
      <div className="mb-8">
        <h1 className="page-header">Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Track your earnings and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6 md:col-span-1 bg-gradient-to-br from-brand-900 to-brand-950 border-brand-500/20">
          <p className="text-gray-400 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold text-white font-display">₹{wallet.balance?.toFixed(2) || '0.00'}</p>
          <p className="text-brand-400 text-xs mt-2">
            {walletLoading ? 'Loading wallet...' : 'Updated just now'}
          </p>
          {!walletLoading && wallet.total_spent === 0 && wallet.balance >= 1000 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-[11px] text-brand-200">
              Welcome credit ₹1000 applied
            </div>
          )}
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Earned</p>
            <p className="text-2xl font-bold text-green-400">₹{wallet.total_earned?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <TrendingDown size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Spent</p>
            <p className="text-2xl font-bold text-red-400">₹{wallet.total_spent?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between gap-3">
          <h2 className="section-title">Transaction History</h2>
          {transactionsLoading ? <Loader2 className="animate-spin text-brand-400" size={18} /> : null}
        </div>
        {transactionsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-400" size={24} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {transactions.map(txn => (
              <div key={txn.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    ${txn.transaction_type === 'credit'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                    {txn.transaction_type === 'credit'
                      ? <ArrowDownLeft size={16} className="text-green-400" />
                      : <ArrowUpRight size={16} className="text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{txn.description}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${txn.transaction_type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.transaction_type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
