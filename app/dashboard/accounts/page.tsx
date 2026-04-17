'use client'

import { useState } from 'react'

export default function AccountsPage() {
  const [linking, setLinking] = useState(false)

  async function handleLinkBank() {
    setLinking(true)
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()

      if (data.linkToken) {
        // In production, initialize Plaid Link with this token
        // For now, show a placeholder
        alert(`Plaid Link Token received. In production, this opens the Plaid Link modal.\n\nToken: ${data.linkToken.substring(0, 20)}...`)
      }
    } catch (error) {
      console.error('Failed to create link token:', error)
    } finally {
      setLinking(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Linked Accounts</h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Manage your connected bank accounts and payment methods.
          </p>
        </div>
      </div>

      {/* Link Options */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-950 dark:text-white">Bank Account</h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">Connect via Plaid for transaction monitoring</p>
            </div>
          </div>
          <button
            onClick={handleLinkBank}
            disabled={linking}
            className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50 transition-colors"
          >
            {linking ? 'Connecting...' : 'Connect Bank Account'}
          </button>
        </div>

        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-950 dark:text-white">Credit / Debit Card</h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">Add via Stripe for payments & auto-pay</p>
            </div>
          </div>
          <button className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
            Add Payment Method
          </button>
        </div>
      </div>

      {/* Linked accounts list */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Your Accounts</h2>
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-5.94a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5a4.5 4.5 0 006.364 0l4.5-4.5z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-navy-950 dark:text-white mb-1">No accounts linked</p>
        <p className="text-xs text-navy-500 dark:text-navy-400">
          Connect a bank account or add a payment method to get started.
        </p>
      </div>
    </div>
  )
}
