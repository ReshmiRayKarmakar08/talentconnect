import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { paymentsAPI } from '../utils/api'

export default function WalletPage() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([paymentsAPI.wallet(), paymentsAPI.transactions()])
      .then(([w, t]) => { setWallet(w.data); setTransactions(t.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 animate-slide-up">
      <div className="mb-8">
        <h1 className="page-header">Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Track your earnings and transactions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-400" size={28} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card p-6 md:col-span-1 bg-gradient-to-br from-brand-900 to-brand-950 border-brand-500/20">
              <p className="text-gray-400 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-white font-display">₹{wallet?.balance?.toFixed(2) || '0.00'}</p>
              <p className="text-brand-400 text-xs mt-2">Updated just now</p>
            </div>
            <div className="card p-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">₹{wallet?.total_earned?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <div className="card p-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <TrendingDown size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-red-400">₹{wallet?.total_spent?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border">
              <h2 className="section-title">Transaction History</h2>
            </div>
            {transactions.length === 0 ? (
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
        </>
      )}
    </div>
  )
}
