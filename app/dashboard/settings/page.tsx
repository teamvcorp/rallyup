'use client'

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [autoPayment, setAutoPayment] = useState(true)
  const [installmentPlan, setInstallmentPlan] = useState<4 | 8 | 12>(4)
  const [cardPayPercent, setCardPayPercent] = useState(75)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Pro Shopper
  const [proStatus, setProStatus] = useState<string>('none')
  const [proLoading, setProLoading] = useState(false)
  const [proNextBilling, setProNextBilling] = useState<string | null>(null)
  const [pointsBalance, setPointsBalance] = useState(0)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.user) {
          setName(data.user.name || '')
          setAutoPayment(data.user.autoPaymentEnabled ?? true)
          setInstallmentPlan(data.user.installmentPlan ?? 4)
          setCardPayPercent(data.user.cardPayPercent ?? 75)
          setProStatus(data.user.proShopperStatus ?? 'none')
          setProNextBilling(data.user.proShopperNextBilling ?? null)
          setPointsBalance(data.user.pointsBalance ?? 0)
        }
      } catch {
        // defaults are fine
      } finally {
        setLoaded(true)
      }
    }
    loadSettings()
  }, [])

  const pointsPercent = 100 - cardPayPercent
  const isPro = proStatus === 'active'
  const accessiblePercent = isPro ? 90 : 45 // 50% of 90% for free, 100% of 90% for pro
  const accessiblePoints = pointsBalance * (accessiblePercent / 100)

  async function handleProSubscribe() {
    if (!confirm('Subscribe to Pro Shopper for $5/month? This will be charged to your linked debit card.')) return
    setProLoading(true)
    try {
      const res = await fetch('/api/subscription/pro-shopper', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setProStatus('active')
        setProNextBilling(data.nextBilling)
      } else {
        alert(data.error || 'Failed to subscribe')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setProLoading(false)
    }
  }

  async function handleProCancel() {
    if (!confirm('Cancel Pro Shopper? You will lose access to the full 90% of your points for financing.')) return
    setProLoading(true)
    try {
      const res = await fetch('/api/subscription/pro-shopper', { method: 'DELETE' })
      if (res.ok) {
        setProStatus('cancelled')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setProLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          autoPaymentEnabled: autoPayment,
          installmentPlan,
          cardPayPercent,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-navy-500 dark:text-navy-400">Loading settings...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-2">Settings</h1>
      <p className="text-sm text-navy-500 dark:text-navy-400 mb-8">
        Manage your account preferences and payment settings.
      </p>

      {/* Profile */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Profile</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Jane Doe"
            />
          </div>
        </div>
      </div>

      {/* Virtual Card Payment Split */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-1">Virtual Card Payment Split</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mb-6">
          When you use your RallyUp virtual card, each purchase is automatically split between your real debit card and your points balance.
        </p>

        {/* Split slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-3">
            Payment Split
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={cardPayPercent}
            onChange={(e) => setCardPayPercent(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-brand-500" />
              <span className="text-sm font-medium text-navy-950 dark:text-white">
                Debit Card: {cardPayPercent}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-accent-500" />
              <span className="text-sm font-medium text-navy-950 dark:text-white">
                Points: {pointsPercent}%
              </span>
            </div>
          </div>

          {/* Visual preview */}
          <div className="mt-4 rounded-lg overflow-hidden h-4 flex">
            <div
              className="bg-brand-500 transition-all duration-200"
              style={{ width: `${cardPayPercent}%` }}
            />
            <div
              className="bg-accent-500 transition-all duration-200"
              style={{ width: `${pointsPercent}%` }}
            />
          </div>

          {/* Example */}
          <div className="mt-4 rounded-lg bg-navy-50 dark:bg-navy-800/50 p-4">
            <p className="text-xs font-medium text-navy-700 dark:text-navy-300 mb-2">Example: $100 purchase</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-navy-500 dark:text-navy-400">Charged to your debit card</span>
                <span className="font-medium text-brand-600 dark:text-brand-400">${cardPayPercent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-500 dark:text-navy-400">Paid from points balance</span>
                <span className="font-medium text-accent-600 dark:text-accent-400">${pointsPercent.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Installment plan */}
        <div>
          <label className="block text-sm font-medium text-navy-700 dark:text-navy-200 mb-3">
            Installment Plan (for debit card portion)
          </label>
          <p className="text-xs text-navy-500 dark:text-navy-400 mb-3">
            The debit card portion can be split into installments. Points portion is deducted immediately.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {([4, 8, 12] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setInstallmentPlan(n)}
                className={`rounded-lg px-4 py-3 text-center ring-2 transition-all ${
                  installmentPlan === n
                    ? 'ring-brand-500 bg-brand-50 dark:bg-brand-950/30'
                    : 'ring-navy-100 dark:ring-white/10 hover:ring-navy-200 dark:hover:ring-white/20'
                }`}
              >
                <span className="block text-lg font-bold text-navy-950 dark:text-white">{n}</span>
                <span className="block text-xs text-navy-500 dark:text-navy-400">payments</span>
                <span className="block text-xs font-medium text-brand-600 dark:text-brand-400 mt-1">
                  every 2 wks
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Payment toggle */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Payment Settings</h2>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-navy-950 dark:text-white">Auto-Payment</p>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Automatically charge your debit card for installments when you use the virtual card.
            </p>
          </div>
          <button
            onClick={() => setAutoPayment(!autoPayment)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              autoPayment ? 'bg-brand-600' : 'bg-navy-200 dark:bg-navy-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                autoPayment ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Pro Shopper Plan */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-navy-950 dark:text-white">Points Access & Pro Shopper</h2>
            <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
              RallyUp keeps 10% of round-ups as a platform fee. You have access to the remaining 90%.
            </p>
          </div>
          {isPro && (
            <span className="inline-flex items-center rounded-full bg-gold-100 dark:bg-gold-900/30 px-2.5 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-400">
              PRO
            </span>
          )}
        </div>

        {/* Tier comparison */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className={`rounded-lg p-4 ring-2 transition-all ${
            !isPro ? 'ring-brand-500 bg-brand-50/50 dark:bg-brand-950/20' : 'ring-navy-100 dark:ring-white/10'
          }`}>
            <p className="text-sm font-semibold text-navy-950 dark:text-white mb-1">Free Plan</p>
            <p className="text-2xl font-bold text-navy-950 dark:text-white">$0<span className="text-sm font-normal text-navy-400">/mo</span></p>
            <ul className="mt-3 space-y-2 text-xs text-navy-600 dark:text-navy-400">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Access to <strong className="text-navy-950 dark:text-white">50% of your points</strong> for financing
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Round-ups & points earning
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Virtual card (when available)
              </li>
            </ul>
            {!isPro && (
              <p className="mt-3 text-xs font-medium text-brand-600 dark:text-brand-400">Current plan</p>
            )}
          </div>

          <div className={`rounded-lg p-4 ring-2 transition-all ${
            isPro ? 'ring-gold-500 bg-gold-50/50 dark:bg-gold-950/20' : 'ring-navy-100 dark:ring-white/10'
          }`}>
            <p className="text-sm font-semibold text-navy-950 dark:text-white mb-1">Pro Shopper</p>
            <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">$5<span className="text-sm font-normal text-navy-400">/mo</span></p>
            <ul className="mt-3 space-y-2 text-xs text-navy-600 dark:text-navy-400">
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Access to <strong className="text-navy-950 dark:text-white">100% of your points</strong> for financing
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                2× financing power
              </li>
              <li className="flex items-start gap-2">
                <svg className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Charged to debit card monthly
              </li>
            </ul>
            {isPro ? (
              <div className="mt-3">
                <p className="text-xs font-medium text-gold-600 dark:text-gold-400 mb-1">Current plan</p>
                {proNextBilling && (
                  <p className="text-xs text-navy-400">Next billing: {new Date(proNextBilling).toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <button
                onClick={handleProSubscribe}
                disabled={proLoading}
                className="mt-3 w-full rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gold-600 disabled:opacity-50 transition-colors"
              >
                {proLoading ? 'Processing...' : 'Upgrade to Pro — $5/mo'}
              </button>
            )}
          </div>
        </div>

        {/* Points access bar */}
        <div className="rounded-lg bg-navy-50 dark:bg-navy-800/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-navy-700 dark:text-navy-300">Your Points Access</p>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              {isPro ? '90%' : '45%'} of earned points available for financing
            </p>
          </div>
          <div className="h-3 rounded-full bg-navy-200 dark:bg-navy-700 overflow-hidden mb-2">
            <div className="h-full flex">
              <div
                className={`transition-all ${isPro ? 'bg-gold-500' : 'bg-brand-500'}`}
                style={{ width: `${accessiblePercent}%` }}
              />
              {!isPro && (
                <div
                  className="bg-navy-300 dark:bg-navy-600"
                  style={{ width: '45%' }}
                  title="Unlock with Pro Shopper"
                />
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-navy-500 dark:text-navy-400">
              Accessible: <strong className={isPro ? 'text-gold-600 dark:text-gold-400' : 'text-brand-600 dark:text-brand-400'}>${accessiblePoints.toFixed(2)}</strong>
            </span>
            <span className="text-navy-400">
              10% platform fee (retained)
            </span>
          </div>
        </div>

        {isPro && (
          <div className="mt-4 pt-4 border-t border-navy-100 dark:border-white/10">
            <button
              onClick={handleProCancel}
              disabled={proLoading}
              className="text-sm text-navy-500 dark:text-navy-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Cancel Pro Shopper subscription
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-red-200 dark:ring-red-500/20 p-6 mb-8">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <button className="rounded-lg border border-red-300 dark:border-red-500/30 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Delete Account
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
            Settings saved!
          </span>
        )}
      </div>
    </div>
  )
}
