'use client'

import { useState } from 'react'

export default function FinancingPage() {
  const [showApply, setShowApply] = useState(false)
  const [itemDescription, setItemDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installments, setInstallments] = useState<4 | 8 | 12>(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/financing/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemDescription,
          totalAmount: parseFloat(totalAmount),
          installments,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to apply for financing')
        return
      }

      setShowApply(false)
      setItemDescription('')
      setTotalAmount('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const numericAmount = parseFloat(totalAmount) || 0
  const installmentPreview = numericAmount > 0 ? (numericAmount / installments).toFixed(2) : '0.00'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Financing & Virtual Card</h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Finance purchases with your points and pay in installments.
          </p>
        </div>
        <button
          onClick={() => setShowApply(!showApply)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          {showApply ? 'Cancel' : 'New Purchase'}
        </button>
      </div>

      {/* Virtual Card */}
      <div className="rounded-xl bg-linear-to-br from-navy-800 via-brand-900 to-navy-950 p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-brand-200">RallyUp Virtual Card</span>
            <svg className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <p className="text-2xl font-mono tracking-[0.2em] mb-6">•••• •••• •••• ••••</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-brand-300">Card Holder</p>
              <p className="text-sm font-medium">Not yet activated</p>
            </div>
            <div>
              <p className="text-xs text-brand-300">Expires</p>
              <p className="text-sm font-medium">--/--</p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Form */}
      {showApply && (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Apply for Financing</h2>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">
                Item Description
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                required
                className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. New headphones"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">
                Total Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">
                Payment Schedule
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([4, 8, 12] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInstallments(n)}
                    className={`rounded-lg px-4 py-3 text-center ring-2 transition-all ${
                      installments === n
                        ? 'ring-brand-500 bg-brand-50 dark:bg-brand-950/30'
                        : 'ring-navy-100 dark:ring-white/10 hover:ring-navy-200 dark:hover:ring-white/20'
                    }`}
                  >
                    <span className="block text-lg font-bold text-navy-950 dark:text-white">{n}</span>
                    <span className="block text-xs text-navy-500 dark:text-navy-400">payments</span>
                    {numericAmount > 0 && (
                      <span className="block text-xs font-medium text-brand-600 dark:text-brand-400 mt-1">
                        ${(numericAmount / n).toFixed(2)}/ea
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {numericAmount > 0 && (
              <div className="rounded-lg bg-navy-50 dark:bg-navy-800/50 p-4">
                <h3 className="text-sm font-medium text-navy-950 dark:text-white mb-2">Payment Preview</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-navy-500 dark:text-navy-400">Total Amount</span>
                    <span className="font-medium text-navy-950 dark:text-white">${numericAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500 dark:text-navy-400">{installments} payments of</span>
                    <span className="font-medium text-navy-950 dark:text-white">${installmentPreview}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-navy-200 dark:border-white/10">
                    <span className="text-navy-500 dark:text-navy-400">Auto-pay</span>
                    <span className="font-medium text-accent-600 dark:text-accent-400">Every 2 weeks</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processing...' : 'Apply for Financing'}
            </button>
          </form>
        </div>
      )}

      {/* Financing Rules */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Financing Rules</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">25% Points Coverage</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Purchase amount cannot exceed 25% of your stored points value
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">12-Month Cap</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Total financing cannot exceed your round-up total from the past 12 months
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Auto-Payment Required</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                All financing plans require automatic bi-weekly payments from your linked payment method
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Flexible Installments</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Choose 4, 8, or 12 equal payments for any financed purchase
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Plans */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Active Financing Plans</h2>
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-navy-950 dark:text-white mb-1">No active financing plans</p>
        <p className="text-xs text-navy-500 dark:text-navy-400">
          Earn points through round-ups, then finance purchases with your virtual card.
        </p>
      </div>
    </div>
  )
}
