'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Types ────────────────────────────────────────────────────────────────
interface LinkedAccount {
  _id: string
  provider: 'stripe' | 'plaid'
  accountName: string
  accountType: string
  lastFour: string
  institutionName?: string
  createdAt: string
}

// ── Plaid Link wrapper ──────────────────────────────────────────────────
function PlaidLinkButton({ onSuccess: onLinkSuccess }: { onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function fetchLinkToken() {
    setLoading(true)
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()
      if (data.linkToken) setLinkToken(data.linkToken)
    } catch (err) {
      console.error('Failed to get link token:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSuccess = useCallback(
    async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      try {
        await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken, metadata }),
        })
        onLinkSuccess()
      } catch (err) {
        console.error('Token exchange failed:', err)
      }
    },
    [onLinkSuccess]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  })

  // If we have a token, open immediately
  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  return (
    <button
      onClick={linkToken ? () => open() : fetchLinkToken}
      disabled={loading || (!!linkToken && !ready)}
      className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Connecting...' : 'Connect Bank Account'}
    </button>
  )
}

// ── Stripe card form ────────────────────────────────────────────────────
function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSaving(true)
    setError(null)

    try {
      // 1. Get a SetupIntent client secret
      const res = await fetch('/api/stripe/setup-intent', { method: 'POST' })
      const { clientSecret, error: apiError } = await res.json()
      if (apiError) throw new Error(apiError)

      // 2. Confirm setup with the card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Card element not found')

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      })

      if (stripeError) {
        setError(stripeError.message ?? 'Card setup failed')
        return
      }

      // 3. Tell our API to attach the payment method
      if (setupIntent?.payment_method) {
        const attachRes = await fetch('/api/stripe/connect-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
        })
        const attachData = await attachRes.json()
        if (attachData.error) throw new Error(attachData.error)
      }

      cardElement.clear()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-lg border border-navy-200 dark:border-white/10 p-3 mb-3 bg-white dark:bg-navy-950">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '15px',
                color: '#1a202c',
                '::placeholder': { color: '#a0aec0' },
              },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || saving}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Add Payment Method'}
      </button>
    </form>
  )
}

// ── Main page ───────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      setAccounts(data.accounts ?? [])
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const bankAccounts = accounts.filter((a) => a.provider === 'plaid')
  const cards = accounts.filter((a) => a.provider === 'stripe')

  async function handleRemove(accountId: string) {
    setRemoving(accountId)
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      await fetchAccounts()
    } catch (err) {
      console.error('Failed to remove account:', err)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Linked Accounts</h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Connect your bank and cards — we monitor both for transactions to round up.
          </p>
        </div>
      </div>

      {/* Link Options */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Plaid — Bank Account */}
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-950 dark:text-white">Bank Account</h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">Connect via Plaid to track transactions</p>
            </div>
          </div>
          <PlaidLinkButton onSuccess={fetchAccounts} />
        </div>

        {/* Stripe — Credit / Debit Card */}
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy-950 dark:text-white">Credit / Debit Card</h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">Add via Stripe to track card spending</p>
            </div>
          </div>
          <Elements stripe={stripePromise}>
            <AddCardForm onSuccess={fetchAccounts} />
          </Elements>
        </div>
      </div>

      {/* Linked accounts list */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Your Accounts</h2>

      {loading ? (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center">
          <p className="text-sm text-navy-500 dark:text-navy-400">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-5.94a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5a4.5 4.5 0 006.364 0l4.5-4.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-navy-950 dark:text-white mb-1">No accounts linked</p>
          <p className="text-xs text-navy-500 dark:text-navy-400">
            Connect a bank account or add a card to start earning round-up points.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Bank accounts */}
          {bankAccounts.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-navy-400 dark:text-navy-500 mb-2">Bank Accounts</h3>
              {bankAccounts.map((a) => (
                <div key={a._id} className="flex items-center gap-4 rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 px-5 py-4 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                    <svg className="h-4 w-4 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-950 dark:text-white truncate">
                      {a.accountName}
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      {a.institutionName ?? 'Bank'} · ···{a.lastFour} · {a.accountType}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-accent-50 dark:bg-accent-900/20 px-2 py-0.5 text-xs font-medium text-accent-700 dark:text-accent-400">
                    Monitoring
                  </span>
                  <button
                    onClick={() => handleRemove(a._id)}
                    disabled={removing === a._id}
                    className="ml-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {removing === a._id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          {cards.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-navy-400 dark:text-navy-500 mb-2">Cards</h3>
              {cards.map((a) => (
                <div key={a._id} className="flex items-center gap-4 rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 px-5 py-4 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-950 dark:text-white truncate capitalize">
                      {a.accountName}
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      ···· {a.lastFour} · {a.accountType}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                    Monitoring
                  </span>
                  <button
                    onClick={() => handleRemove(a._id)}
                    disabled={removing === a._id}
                    className="ml-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {removing === a._id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
