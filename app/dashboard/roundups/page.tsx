'use client'

import { useState } from 'react'

export default function RoundUpsPage() {
  const [preference, setPreference] = useState<'half' | 'whole'>('whole')
  const [saving, setSaving] = useState(false)

  async function savePreference(newPref: 'half' | 'whole') {
    setPreference(newPref)
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundUpPreference: newPref }),
      })
    } catch (error) {
      console.error('Failed to save preference:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-2">Round-Up Settings</h1>
      <p className="text-sm text-navy-500 dark:text-navy-400 mb-8">
        Choose how your transactions are rounded up to earn points.
      </p>

      {/* Round-up Preference */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-2">Rounding Preference</h2>
        <p className="text-sm text-navy-500 dark:text-navy-400 mb-6">
          Select how you&apos;d like your transactions rounded up. Higher round-ups mean faster points earning.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => savePreference('half')}
            disabled={saving}
            className={`rounded-xl p-6 text-left ring-2 transition-all ${
              preference === 'half'
                ? 'ring-brand-500 bg-brand-50 dark:bg-brand-950/30'
                : 'ring-navy-100 dark:ring-white/10 hover:ring-navy-200 dark:hover:ring-white/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                preference === 'half' ? 'border-brand-500' : 'border-navy-300 dark:border-navy-600'
              }`}>
                {preference === 'half' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                )}
              </div>
              <span className="text-sm font-semibold text-navy-950 dark:text-white">Nearest $0.50</span>
            </div>
            <div className="pl-8">
              <p className="text-xs text-navy-500 dark:text-navy-400 mb-3">
                Smaller round-ups, more frequent. Good for budget-conscious savers.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$5.45 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.05 points</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$12.20 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.30 points</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$8.75 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.25 points</span>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => savePreference('whole')}
            disabled={saving}
            className={`rounded-xl p-6 text-left ring-2 transition-all ${
              preference === 'whole'
                ? 'ring-brand-500 bg-brand-50 dark:bg-brand-950/30'
                : 'ring-navy-100 dark:ring-white/10 hover:ring-navy-200 dark:hover:ring-white/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                preference === 'whole' ? 'border-brand-500' : 'border-navy-300 dark:border-navy-600'
              }`}>
                {preference === 'whole' && (
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy-950 dark:text-white">Nearest $1.00</span>
                <span className="rounded-full bg-gold-100 dark:bg-gold-900/30 px-2 py-0.5 text-[10px] font-semibold text-gold-700 dark:text-gold-400">
                  POPULAR
                </span>
              </div>
            </div>
            <div className="pl-8">
              <p className="text-xs text-navy-500 dark:text-navy-400 mb-3">
                Bigger round-ups, faster points. Best for building financing power quickly.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$5.45 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.55 points</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$12.20 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.80 points</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-navy-400 dark:text-navy-500">$8.75 purchase</span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">+$0.25 points</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Estimated earnings */}
      <div className="rounded-xl bg-linear-to-br from-accent-600 to-accent-800 p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Estimated Earnings</h2>
        <p className="text-sm text-accent-100 mb-4">
          Based on average spending patterns with {preference === 'whole' ? '$1.00' : '$0.50'} round-ups:
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-accent-200">Monthly</p>
            <p className="text-2xl font-bold">{preference === 'whole' ? '~$15' : '~$8'}</p>
          </div>
          <div>
            <p className="text-xs text-accent-200">Annual</p>
            <p className="text-2xl font-bold">{preference === 'whole' ? '~$180' : '~$96'}</p>
          </div>
          <div>
            <p className="text-xs text-accent-200">Financing Power</p>
            <p className="text-2xl font-bold">{preference === 'whole' ? '~$45' : '~$24'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
