import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-navy-950">
      {/* Navigation */}
      <nav className="border-b border-navy-100 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <span className="text-xl font-bold text-navy-950 dark:text-white">RallyUp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-navy-700 hover:text-brand-600 dark:text-navy-200 dark:hover:text-brand-400"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 dark:bg-accent-950 px-4 py-1.5 mb-8">
            <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-sm font-medium text-accent-700 dark:text-accent-400">
              No credit score. No applications. Just your spending.
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-navy-950 dark:text-white leading-tight">
            Purchasing Power Built by
            <span className="block text-brand-600 dark:text-brand-400">You, Not Your Credit Score</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-navy-600 dark:text-navy-300 leading-8">
            RallyUp turns your everyday spare change into real buying power.
            Round up every transaction, earn points, and unlock instant financing
            with a virtual card — no credit checks, no interest, no gatekeepers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg border border-navy-200 dark:border-white/15 px-6 py-3 text-base font-semibold text-navy-900 dark:text-white hover:bg-navy-50 dark:hover:bg-white/5 transition-colors"
            >
              How It Works
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-navy-50 dark:bg-navy-950/50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center text-navy-950 dark:text-white mb-16">
              How RallyUp Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Link Your Accounts",
                  desc: "Connect your credit card or bank account securely with Stripe and Plaid.",
                  color: "bg-brand-600",
                },
                {
                  step: "2",
                  title: "Auto Round-Up",
                  desc: "Every purchase rounds up to the nearest $0.50 or $1.00 — your choice.",
                  color: "bg-accent-600",
                },
                {
                  step: "3",
                  title: "Earn Points",
                  desc: "Round-ups become points at 1:1 value. $0.55 round-up = 0.55 points.",
                  color: "bg-gold-500",
                },
                {
                  step: "4",
                  title: "Shop & Finance",
                  desc: "Use your virtual card for purchases with instant financing in 4, 8, or 12 payments.",
                  color: "bg-navy-700",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div
                    className={`${item.color} h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <span className="text-white font-bold text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-navy-600 dark:text-navy-300 text-sm leading-6">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* No Credit Score Banner */}
        <section className="py-16 bg-white dark:bg-navy-950">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-2xl bg-navy-950 dark:bg-white/5 ring-1 ring-white/10 p-10 sm:p-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-brand-900)_0%,_transparent_60%)] opacity-40" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-6">
                  <svg className="h-4 w-4 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  <span className="text-sm font-medium text-white/80">Freedom to Live</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                  Your Purchasing Power Should Be Yours
                </h2>
                <p className="mx-auto max-w-2xl text-base text-navy-300 leading-7 mb-8">
                  Traditional financing locks people out based on a three-digit number they didn&apos;t
                  choose. RallyUp is different — your buying power comes from your own habits,
                  your own savings, your own discipline. No credit checks. No interest. No judgment.
                  Just real purchasing power you built yourself.
                </p>
                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    No credit score required
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Zero interest, always
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Backed by your own savings
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    No hidden fees
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-navy-100 dark:border-white/10 p-8">
                <div className="h-10 w-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-2">Bank-Level Security</h3>
                <p className="text-navy-600 dark:text-navy-300 text-sm leading-6">
                  Powered by Stripe and Plaid with end-to-end encryption. Your financial data never touches our servers.
                </p>
              </div>
              <div className="rounded-2xl border border-navy-100 dark:border-white/10 p-8">
                <div className="h-10 w-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-4">
                  <svg className="h-5 w-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-2">Your Card, Your Rules</h3>
                <p className="text-navy-600 dark:text-navy-300 text-sm leading-6">
                  Get a Stripe-issued virtual card backed by the purchasing power you
                  built — no application, no approval wait, no credit inquiry.
                </p>
              </div>
              <div className="rounded-2xl border border-navy-100 dark:border-white/10 p-8">
                <div className="h-10 w-10 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center mb-4">
                  <svg className="h-5 w-5 text-gold-600 dark:text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-navy-950 dark:text-white mb-2">Financing You Earned</h3>
                <p className="text-navy-600 dark:text-navy-300 text-sm leading-6">
                  Finance up to 25% of your points at zero interest. Pay in 4, 8, or 12
                  installments — because you earned it, literally.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-100 dark:border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-navy-500 dark:text-navy-400">
              &copy; {new Date().getFullYear()} RallyUp. All rights reserved.
            </p>
            <p className="text-xs text-navy-400/70 dark:text-navy-500/70">
              A <span className="font-medium text-navy-500 dark:text-navy-400">Fyht4</span> project
              &middot; Von der Becke Academy Corp &middot; 501(c)(3)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
