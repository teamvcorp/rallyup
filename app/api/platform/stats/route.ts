import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDb()

    // Get start of current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Sum all completed round-up transactions this month
    const pipeline = [
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalRoundUps: { $sum: '$roundUpAmount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]

    const result = await db.collection('roundUpTransactions').aggregate(pipeline).toArray()
    const totalRoundUps = result[0]?.totalRoundUps ?? 0
    const transactionCount = result[0]?.transactionCount ?? 0
    const threshold = 20000
    const issuingEnabled = totalRoundUps >= threshold

    return NextResponse.json({
      monthlyRoundUps: Math.round(totalRoundUps * 100) / 100,
      transactionCount,
      threshold,
      issuingEnabled,
      progressPercent: Math.min(100, Math.round((totalRoundUps / threshold) * 100)),
    })
  } catch (error) {
    console.error('Platform stats error:', error)
    return NextResponse.json({ error: 'Failed to load platform stats' }, { status: 500 })
  }
}
