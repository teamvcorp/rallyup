'use client'

import { useState, useEffect } from 'react'

interface VirtualCard {
  id: string
  last4: string
  exp_month: number
  exp_year: number
  cardholder: { name: string }
  status: string
}

interface CardRequirements {
  disabledReason: string
  pastDue: string[]
}

interface FinancingPlan {
  _id: string
  totalAmount: number
  cardShare: number
  pointsShare: number
  installments: number
  installmentAmount: number
  paidInstallments: number
  status: string
  merchantName: string
  createdAt: string
  cashedOutAt?: string
}

export default function FinancingPage() {
  const [card, setCard] = useState<VirtualCard | null>(null)
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardFetched, setCardFetched] = useState(false)
  const [needsInfo, setNeedsInfo] = useState(false)
  const [cardholderId, setCardholderId] = useState<string | null>(null)
  const [requirements, setRequirements] = useState<CardRequirements | null>(null)

  // Activation form fields
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formLine1, setFormLine1] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formPostalCode, setFormPostalCode] = useState('')

  // Financing plans
  const [plans, setPlans] = useState<FinancingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Platform issuing gate
  const [issuingEnabled, setIssuingEnabled] = useState(false)
  const [platformProgress, setPlatformProgress] = useState(0)
  const [monthlyRoundUps, setMonthlyRoundUps] = useState(0)
  const [platformLoaded, setPlatformLoaded] = useState(false)

  // Fetch existing card on mount (GET doesn't create one)
  useEffect(() => {
    async function loadCard() {
      try {
        const res = await fetch('/api/stripe/virtual-card')
        const data = await res.json()
        if (data.card) setCard(data.card)
      } catch {
        // no card yet
      } finally {
        setCardFetched(true)
      }
    }
    loadCard()
  }, [])

  // Load platform issuing status
  useEffect(() => {
    async function loadPlatformStats() {
      try {
        const res = await fetch('/api/platform/stats')
        const data = await res.json()
        setIssuingEnabled(data.issuingEnabled)
        setPlatformProgress(data.progressPercent ?? 0)
        setMonthlyRoundUps(data.monthlyRoundUps ?? 0)
      } catch {
        // default to disabled
      } finally {
        setPlatformLoaded(true)
      }
    }
    loadPlatformStats()
  }, [])

  // Load financing plans
  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    try {
      const res = await fetch('/api/financing/plans')
      const data = await res.json()
      setPlans(data.plans ?? [])
    } catch {
      // no plans
    } finally {
      setPlansLoading(false)
    }
  }

  async function handleActivateCard() {
    setCardLoading(true)
    setCardError('')
    try {
      const res = await fetch('/api/stripe/virtual-card', { method: 'POST' })
      const data = await res.json()
      if (data.needsInfo) {
        setCard(data.card || null)
        setNeedsInfo(true)
        setCardholderId(data.cardholderId)
        setRequirements(data.requirements)
        setCardError('')
        return
      }
      if (!res.ok) {
        setCardError(data.error || 'Failed to create virtual card')
        return
      }
      setCard(data.card)
      setNeedsInfo(false)
    } catch {
      setCardError('Something went wrong. Please try again.')
    } finally {
      setCardLoading(false)
    }
  }

  async function handleSubmitCardholderInfo(e: React.FormEvent) {
    e.preventDefault()
    setCardLoading(true)
    setCardError('')
    try {
      const res = await fetch('/api/stripe/virtual-card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardholderId,
          name: formName || undefined,
          phone: formPhone || undefined,
          line1: formLine1 || undefined,
          city: formCity || undefined,
          state: formState || undefined,
          postalCode: formPostalCode || undefined,
        }),
      })
      const data = await res.json()
      if (data.needsInfo) {
        setRequirements(data.requirements)
        setCardError(data.error || 'Additional information still required.')
        return
      }
      if (!res.ok) {
        setCardError(data.error || 'Failed to activate card')
        return
      }
      setCard(data.card)
      setNeedsInfo(false)
      setCardError('')
    } catch {
      setCardError('Something went wrong. Please try again.')
    } finally {
      setCardLoading(false)
    }
  }

  async function handleCashOut(planId: string) {
    if (!confirm('Cash out this purchase? Your remaining installments will be cancelled and the equivalent points will be deducted. The product was paid for by your points.')) return

    setActionLoading(planId)
    try {
      const res = await fetch('/api/financing/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      if (res.ok) {
        await fetchPlans()
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const activePlans = plans.filter((p) => p.status === 'active')
  const settledPlans = plans.filter((p) => ['completed', 'cashed_out'].includes(p.status))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Financing & Virtual Card</h1>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
            Use your virtual card to buy anything — each purchase is automatically split between your debit card and points.
          </p>
      </div>

      {/* Virtual Card */}
      <div className="rounded-xl bg-linear-to-br from-navy-800 via-brand-900 to-navy-950 p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm font-medium text-brand-200">RallyUp Virtual Card</span>
            <div className="flex items-center gap-2">
              {card && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.status === 'active'
                    ? 'bg-accent-500/20 text-accent-300'
                    : 'bg-gold-500/20 text-gold-300'
                }`}>
                  {card.status}
                </span>
              )}
              <svg className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-mono tracking-[0.2em] mb-6">
            {card ? `•••• •••• •••• ${card.last4}` : '•••• •••• •••• ••••'}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-brand-300">Card Holder</p>
              <p className="text-sm font-medium">{card?.cardholder?.name ?? 'Not yet activated'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-300">Expires</p>
              <p className="text-sm font-medium">
                {card ? `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}` : '--/--'}
              </p>
            </div>
          </div>
          {(!card || card.status === 'inactive') && cardFetched && !needsInfo && (
            <div className="mt-6">
              {issuingEnabled ? (
                <>
                  {cardError && (
                    <p className="text-xs text-red-300 mb-2">{cardError}</p>
                  )}
                  <button
                    onClick={handleActivateCard}
                    disabled={cardLoading}
                    className="rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    {cardLoading ? 'Activating...' : card ? 'Activate Card' : 'Activate Virtual Card'}
                  </button>
                </>
              ) : platformLoaded ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-semibold text-gold-300">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-brand-200 mb-3">
                    Virtual card issuing activates when our community reaches $20,000/month in round-ups.
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-gold-400 to-accent-400 transition-all"
                      style={{ width: `${platformProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-brand-300">
                    <span>${monthlyRoundUps.toLocaleString()} collected</span>
                    <span>$20,000 goal</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Cardholder Info Form */}
      {needsInfo && issuingEnabled && (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-1">Complete Your Information</h2>
          <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
            Stripe requires the following to activate your virtual card.
          </p>

          {requirements?.pastDue && requirements.pastDue.length > 0 && (
            <div className="rounded-lg bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-500/20 p-3 mb-4">
              <p className="text-xs font-medium text-gold-800 dark:text-gold-300 mb-1">Missing fields:</p>
              <ul className="list-disc list-inside text-xs text-gold-700 dark:text-gold-400">
                {requirements.pastDue.map((field) => (
                  <li key={field}>{field.replace(/_/g, ' ').replace(/\./g, ' › ')}</li>
                ))}
              </ul>
            </div>
          )}

          {cardError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-400">{cardError}</p>
            </div>
          )}

          <form onSubmit={handleSubmitCardholderInfo} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">Street Address</label>
              <input
                type="text"
                value={formLine1}
                onChange={(e) => setFormLine1(e.target.value)}
                className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">City</label>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">State</label>
                <input
                  type="text"
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  maxLength={2}
                  className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">ZIP Code</label>
                <input
                  type="text"
                  value={formPostalCode}
                  onChange={(e) => setFormPostalCode(e.target.value)}
                  className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="94111"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={cardLoading}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {cardLoading ? 'Submitting...' : 'Submit & Activate Card'}
              </button>
              <button
                type="button"
                onClick={() => setNeedsInfo(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Use your virtual card to buy something</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Each purchase is automatically split between your debit card and points based on your settings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Points deducted immediately</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                The points portion of the purchase is deducted from your balance right away.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-accent-600 dark:text-accent-400">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Choose your path</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                After each purchase, you decide:
              </p>
              <div className="mt-2 grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-brand-50 dark:bg-brand-950/20 p-3">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Keep Paying</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    Continue installments to maintain your points value. Your debit card share is paid over time.
                  </p>
                </div>
                <div className="rounded-lg bg-accent-50 dark:bg-accent-950/20 p-3">
                  <p className="text-xs font-semibold text-accent-700 dark:text-accent-400 mb-1">Cash Out</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    Stop paying installments — your points cover the rest. Product costs you nothing, but your points go to zero.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Plans */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Active Purchases</h2>

      {plansLoading ? (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center mb-8">
          <p className="text-sm text-navy-500 dark:text-navy-400">Loading purchases...</p>
        </div>
      ) : activePlans.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-navy-950 dark:text-white mb-1">No active purchases</p>
          <p className="text-xs text-navy-500 dark:text-navy-400">
            Use your virtual card to make a purchase and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activePlans.map((plan) => {
            const alreadyPaid = plan.paidInstallments * plan.installmentAmount
            const remaining = plan.cardShare - alreadyPaid
            const progressPercent = plan.installments > 0 ? (plan.paidInstallments / plan.installments) * 100 : 0

            return (
              <div key={plan._id} className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-950 dark:text-white">{plan.merchantName}</p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      {new Date(plan.createdAt).toLocaleDateString()} · ${plan.totalAmount.toFixed(2)} total
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                    {plan.paidInstallments}/{plan.installments} paid
                  </span>
                </div>

                {/* Split breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-navy-50 dark:bg-navy-800/50 p-3">
                    <p className="text-xs text-navy-500 dark:text-navy-400">Debit Card Share</p>
                    <p className="text-sm font-bold text-navy-950 dark:text-white">${plan.cardShare.toFixed(2)}</p>
                    <p className="text-xs text-navy-400">${alreadyPaid.toFixed(2)} paid · ${remaining.toFixed(2)} left</p>
                  </div>
                  <div className="rounded-lg bg-navy-50 dark:bg-navy-800/50 p-3">
                    <p className="text-xs text-navy-500 dark:text-navy-400">Points Used</p>
                    <p className="text-sm font-bold text-accent-600 dark:text-accent-400">${plan.pointsShare.toFixed(2)}</p>
                    <p className="text-xs text-navy-400">Deducted at purchase</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-lg bg-brand-50 dark:bg-brand-950/20 px-4 py-3 text-center">
                    <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-0.5">Keep Paying</p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      ${plan.installmentAmount.toFixed(2)}/installment · Maintain points
                    </p>
                  </div>
                  <button
                    onClick={() => handleCashOut(plan._id)}
                    disabled={actionLoading === plan._id}
                    className="rounded-lg bg-accent-50 dark:bg-accent-950/20 px-4 py-3 text-center hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors disabled:opacity-50"
                  >
                    <p className="text-xs font-semibold text-accent-700 dark:text-accent-400 mb-0.5">
                      {actionLoading === plan._id ? 'Processing...' : 'Cash Out'}
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      Points cover it · $0 cost
                    </p>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Settled Plans */}
      {settledPlans.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Past Purchases</h2>
          <div className="space-y-3 mb-8">
            {settledPlans.map((plan) => (
              <div key={plan._id} className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-950 dark:text-white">{plan.merchantName}</p>
                    <p className="text-xs text-navy-500 dark:text-navy-400">
                      {new Date(plan.createdAt).toLocaleDateString()} · ${plan.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    plan.status === 'cashed_out'
                      ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                      : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400'
                  }`}>
                    {plan.status === 'cashed_out' ? 'Cashed Out — $0 cost' : 'Paid Off'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
