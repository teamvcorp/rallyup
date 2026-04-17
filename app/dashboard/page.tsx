import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-500 dark:text-navy-400">Points Balance</span>
          </div>
          <p className="text-3xl font-bold text-navy-950 dark:text-white">0.00</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">$0.00 value</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-500 dark:text-navy-400">This Month</span>
          </div>
          <p className="text-3xl font-bold text-navy-950 dark:text-white">$0.00</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">round-ups earned</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-gold-600 dark:text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-500 dark:text-navy-400">Financing Available</span>
          </div>
          <p className="text-3xl font-bold text-navy-950 dark:text-white">$0.00</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">25% of points</p>
        </div>

        <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
              <svg className="h-5 w-5 text-navy-600 dark:text-navy-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-500 dark:text-navy-400">Active Plans</span>
          </div>
          <p className="text-3xl font-bold text-navy-950 dark:text-white">0</p>
          <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">financing plans</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/accounts"
          className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 hover:ring-brand-300 dark:hover:ring-brand-700 transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center mb-3 group-hover:bg-brand-700 transition-colors">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-5.94a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5a4.5 4.5 0 006.364 0l4.5-4.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-navy-950 dark:text-white mb-1">Link Account</h3>
          <p className="text-xs text-navy-500 dark:text-navy-400">Connect your bank account or credit card</p>
        </Link>

        <Link
          href="/dashboard/roundups"
          className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 hover:ring-accent-300 dark:hover:ring-accent-700 transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-accent-600 flex items-center justify-center mb-3 group-hover:bg-accent-700 transition-colors">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-navy-950 dark:text-white mb-1">Round-Up Settings</h3>
          <p className="text-xs text-navy-500 dark:text-navy-400">Configure your round-up preferences</p>
        </Link>

        <Link
          href="/dashboard/financing"
          className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 hover:ring-gold-300 dark:hover:ring-gold-700 transition-all group"
        >
          <div className="h-10 w-10 rounded-lg bg-gold-500 flex items-center justify-center mb-3 group-hover:bg-gold-600 transition-colors">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-navy-950 dark:text-white mb-1">Virtual Card</h3>
          <p className="text-xs text-navy-500 dark:text-navy-400">Get your card and start financing</p>
        </Link>
      </div>

      {/* Recent Activity Placeholder */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Recent Round-Ups</h2>
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-navy-400 dark:text-navy-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-navy-950 dark:text-white mb-1">No activity yet</p>
        <p className="text-xs text-navy-500 dark:text-navy-400">
          Link a bank account to start earning round-up points automatically.
        </p>
      </div>
    </div>
  )
}
