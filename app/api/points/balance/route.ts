import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const balance = await db.collection('pointsBalances').findOne({
      userId: session.user.id,
    })

    return NextResponse.json({
      balance: balance?.balance || 0,
      totalEarned: balance?.totalEarned || 0,
      totalSpent: balance?.totalSpent || 0,
    })
  } catch (error) {
    console.error('Points balance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch points balance' },
      { status: 500 }
    )
  }
}
