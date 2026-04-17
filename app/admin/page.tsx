'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface UserRecord {
  _id: string
  email: string
  name: string
  role?: string
  suspended?: boolean
  proShopperStatus?: string
  proShopperNextBilling?: string
  pointsBalance: number
  stripeCustomerId?: string
  stripeIssuingCardId?: string
  createdAt: string
  cardPayPercent?: number
  installmentPlan?: number
}

interface PlatformStats {
  totalUsers: number
  monthlyRoundUps: number
  monthlyTransactions: number
  allTimeRoundUps: number
  allTimeTransactions: number
  companyRevenue10Pct: number
  monthlyCompanyRevenue: number
  activeFinancingPlans: number
  proShopperCount: number
  issuingThreshold: number
  issuingProgress: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.status === 403) {
        setError('Access denied. You must be an admin.')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? [])
      setStats(data.stats ?? null)
    } catch {
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(userId: string, action: string, value?: string) {
    setActionLoading(`${userId}-${action}`)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      })
      if (res.ok) {
        await loadData()
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 dark:bg-navy-950 flex items-center justify-center">
        <p className="text-sm text-navy-500">Loading admin panel...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-50 dark:bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 border-b border-navy-100 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-navy-950 dark:text-white">RallyUp Admin</h1>
              <p className="text-xs text-navy-500 dark:text-navy-400">Platform management</p>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Platform Stats */}
        {stats && (
          <>
            <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Platform Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-5">
                <p className="text-xs text-navy-500 dark:text-navy-400">Total Users</p>
                <p className="text-2xl font-bold text-navy-950 dark:text-white">{stats.totalUsers}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-5">
                <p className="text-xs text-navy-500 dark:text-navy-400">Pro Shoppers</p>
                <p className="text-2xl font-bold text-gold-600 dark:text-gold-400">{stats.proShopperCount}</p>
                <p className="text-xs text-navy-400">${(stats.proShopperCount * 5).toFixed(2)}/mo revenue</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-5">
                <p className="text-xs text-navy-500 dark:text-navy-400">Active Financing Plans</p>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.activeFinancingPlans}</p>
              </div>
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-5">
                <p className="text-xs text-navy-500 dark:text-navy-400">All-Time Round-Ups</p>
                <p className="text-2xl font-bold text-navy-950 dark:text-white">${stats.allTimeRoundUps.toLocaleString()}</p>
                <p className="text-xs text-navy-400">{stats.allTimeTransactions.toLocaleString()} transactions</p>
              </div>
            </div>

            {/* Revenue & Issuing Progress */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Company Revenue */}
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
                <h3 className="text-sm font-semibold text-navy-950 dark:text-white mb-4">Company Revenue (10% Cut)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-navy-500 dark:text-navy-400">This month</span>
                    <span className="text-sm font-bold text-accent-600 dark:text-accent-400">${stats.monthlyCompanyRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-navy-500 dark:text-navy-400">All-time</span>
                    <span className="text-sm font-bold text-accent-600 dark:text-accent-400">${stats.companyRevenue10Pct.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-navy-500 dark:text-navy-400">Pro Shopper subscriptions</span>
                    <span className="text-sm font-bold text-gold-600 dark:text-gold-400">${(stats.proShopperCount * 5).toFixed(2)}/mo</span>
                  </div>
                  <div className="border-t border-navy-100 dark:border-white/10 pt-3 flex justify-between">
                    <span className="text-sm font-medium text-navy-950 dark:text-white">Total monthly revenue</span>
                    <span className="text-sm font-bold text-navy-950 dark:text-white">
                      ${(stats.monthlyCompanyRevenue + stats.proShopperCount * 5).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stripe Issuing Progress */}
              <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
                <h3 className="text-sm font-semibold text-navy-950 dark:text-white mb-2">Stripe Issuing Activation</h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 mb-4">
                  Requires $20,000/month in round-ups to activate card issuing for all users.
                </p>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-navy-950 dark:text-white">${stats.monthlyRoundUps.toLocaleString()}</span>
                    <span className="text-navy-400">$20,000</span>
                  </div>
                  <div className="h-4 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stats.issuingProgress >= 100
                          ? 'bg-accent-500'
                          : 'bg-linear-to-r from-gold-400 to-brand-500'
                      }`}
                      style={{ width: `${stats.issuingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-navy-400 mt-1.5">{stats.issuingProgress}% — {stats.monthlyTransactions} round-up transactions this month</p>
                </div>
                <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  stats.issuingProgress >= 100
                    ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400'
                    : 'bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-400'
                }`}>
                  {stats.issuingProgress >= 100 ? 'Active' : 'Not yet active'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Table */}
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-navy-100 dark:border-white/10 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-navy-950 dark:text-white">Users ({users.length})</h3>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-64 rounded-lg border border-navy-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm text-navy-950 dark:text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-100 dark:border-white/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">Points</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">Card</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-navy-500 dark:text-navy-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 dark:divide-white/10">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={user.suspended ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-navy-950 dark:text-white">{user.name}</p>
                      <p className="text-xs text-navy-500 dark:text-navy-400">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 mt-1">ADMIN</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-navy-950 dark:text-white">${user.pointsBalance.toFixed(2)}</p>
                      <p className="text-xs text-navy-400">
                        Accessible: ${(user.pointsBalance * (user.proShopperStatus === 'active' ? 0.9 : 0.45)).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {user.proShopperStatus === 'active' ? (
                        <span className="inline-flex items-center rounded-full bg-gold-100 dark:bg-gold-900/30 px-2 py-0.5 text-xs font-semibold text-gold-700 dark:text-gold-400">
                          Pro
                        </span>
                      ) : (
                        <span className="text-xs text-navy-400">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.suspended ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-accent-100 dark:bg-accent-900/30 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:text-accent-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.stripeIssuingCardId ? (
                        <span className="text-xs text-accent-600 dark:text-accent-400">Issued</span>
                      ) : user.stripeCustomerId ? (
                        <span className="text-xs text-navy-400">Payment linked</span>
                      ) : (
                        <span className="text-xs text-navy-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.suspended ? (
                          <button
                            onClick={() => handleAction(user._id, 'unsuspend')}
                            disabled={actionLoading === `${user._id}-unsuspend`}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors disabled:opacity-50"
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Suspend ${user.email}?`)) handleAction(user._id, 'suspend')
                            }}
                            disabled={actionLoading === `${user._id}-suspend`}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const pw = prompt(`Reset password for ${user.email}? Enter new password:`, 'RallyUp2024!')
                            if (pw) handleAction(user._id, 'resetPassword', pw)
                          }}
                          disabled={actionLoading === `${user._id}-resetPassword`}
                          className="rounded px-2.5 py-1 text-xs font-medium bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors disabled:opacity-50"
                        >
                          Reset PW
                        </button>
                        {user.proShopperStatus === 'active' && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel Pro Shopper for ${user.email}?`)) handleAction(user._id, 'cancelProShopper')
                            }}
                            disabled={actionLoading === `${user._id}-cancelProShopper`}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-gold-50 dark:bg-gold-950/20 text-gold-700 dark:text-gold-400 hover:bg-gold-100 dark:hover:bg-gold-900/30 transition-colors disabled:opacity-50"
                          >
                            Cancel Pro
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`Make ${user.email} an admin?`)) handleAction(user._id, 'setRole', 'admin')
                            }}
                            disabled={actionLoading === `${user._id}-setRole`}
                            className="rounded px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-navy-500 dark:text-navy-400">
                      {search ? 'No users match your search.' : 'No users yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
