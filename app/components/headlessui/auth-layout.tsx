import type React from 'react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-zinc-950 p-2">
      <div className="flex grow items-center justify-center rounded-lg bg-zinc-900 p-6 shadow-xs ring-1 ring-white/10 lg:p-10">
        {children}
      </div>
    </main>
  )
}
