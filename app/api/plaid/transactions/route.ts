import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: session.user.id })

    if (!user?.plaidAccessToken) {
      return NextResponse.json({ error: 'No linked bank account' }, { status: 400 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    return NextResponse.json({ transactions: response.data.transactions })
  } catch (error) {
    console.error('Plaid transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
