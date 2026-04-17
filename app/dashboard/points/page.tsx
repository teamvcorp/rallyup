export default function PointsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-2">Points</h1>
      <p className="text-sm text-navy-500 dark:text-navy-400 mb-8">
        Track your points balance and earning history. 1 point = $1.00 in value.
      </p>

      {/* Balance Card */}
      <div className="rounded-xl bg-linear-to-br from-brand-600 to-brand-800 p-8 mb-8 text-white">
        <p className="text-sm font-medium text-brand-200 mb-1">Available Points</p>
        <p className="text-4xl font-bold mb-4">0.00</p>
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-brand-200">Total Earned</p>
            <p className="text-lg font-semibold">0.00</p>
          </div>
          <div>
            <p className="text-xs text-brand-200">Total Spent</p>
            <p className="text-lg font-semibold">0.00</p>
          </div>
          <div>
            <p className="text-xs text-brand-200">Financing Power</p>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
        </div>
      </div>

      {/* How Points Work */}
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 p-6 mb-8">
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">How Points Work</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-accent-700 dark:text-accent-400">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Earn</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">Every transaction rounds up and earns points at 1:1 value</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-brand-700 dark:text-brand-400">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Grow</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">Points accumulate automatically — no action needed</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-gold-700 dark:text-gold-400">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-950 dark:text-white">Spend</p>
              <p className="text-xs text-navy-500 dark:text-navy-400">Use points to finance purchases with your virtual card</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-4">Points History</h2>
      <div className="rounded-xl bg-white dark:bg-navy-900 ring-1 ring-navy-100 dark:ring-white/10 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-navy-50 dark:bg-navy-800/50 border-b border-navy-100 dark:border-white/10">
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400">Date</span>
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400">Original</span>
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400">Rounded To</span>
          <span className="text-xs font-medium text-navy-500 dark:text-navy-400 text-right">Points Earned</span>
        </div>
        {/* Empty state */}
        <div className="p-8 text-center">
          <p className="text-sm text-navy-500 dark:text-navy-400">
            No round-up transactions yet. Link a bank account to start earning.
          </p>
        </div>
      </div>
    </div>
  )
}
