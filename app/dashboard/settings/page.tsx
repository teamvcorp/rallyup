'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [autoPayment, setAutoPayment] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

      {/* Payment Settings */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-6">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Payment Settings</h2>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-navy-950 dark:text-white">Auto-Payment</p>
            <p className="text-xs text-navy-500 dark:text-navy-400">
              Automatically pay financing installments from your linked payment method. Required for all financing plans.
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
