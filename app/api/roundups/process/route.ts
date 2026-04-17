import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { plaidClient } from '@/lib/plaid'

// Process round-ups from Plaid transactions
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: session.user.id })

    if (!user?.plaidAccessToken) {
      return NextResponse.json(
        { error: 'No linked bank account' },
        { status: 400 }
      )
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const response = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: sevenDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    const preference = user.roundUpPreference || 'whole'
    let totalRoundUp = 0
    const newTransactions = []

    for (const txn of response.data.transactions) {
      if (txn.amount <= 0) continue // Skip credits/refunds

      // Check if we already processed this transaction
      const existing = await db.collection('roundUpTransactions').findOne({
        plaidTransactionId: txn.transaction_id,
      })
      if (existing) continue

      const originalAmount = txn.amount
      let roundedAmount: number

      if (preference === 'half') {
        roundedAmount = Math.ceil(originalAmount * 2) / 2
      } else {
        roundedAmount = Math.ceil(originalAmount)
      }

      const roundUpAmount = Math.round((roundedAmount - originalAmount) * 100) / 100

      if (roundUpAmount <= 0) continue

      newTransactions.push({
        userId: session.user.id,
        originalAmount,
        roundedAmount,
        roundUpAmount,
        pointsEarned: roundUpAmount,
        plaidTransactionId: txn.transaction_id,
        status: 'completed' as const,
        createdAt: new Date(),
      })

      totalRoundUp += roundUpAmount
    }

    if (newTransactions.length > 0) {
      await db.collection('roundUpTransactions').insertMany(newTransactions)

      // Update points balance
      await db.collection('pointsBalances').updateOne(
        { userId: session.user.id },
        {
          $inc: {
            balance: totalRoundUp,
            totalEarned: totalRoundUp,
          },
          $set: { updatedAt: new Date() },
        }
      )
    }

    return NextResponse.json({
      processed: newTransactions.length,
      totalRoundUp,
    })
  } catch (error) {
    console.error('Round-up processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process round-ups' },
      { status: 500 }
    )
  }
}
