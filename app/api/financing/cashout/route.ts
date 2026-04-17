import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST — cash out a financing plan: stop installments, zero out the points used
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 })
    }

    const db = await getDb()

    // Verify plan belongs to user and is active
    const plan = await db.collection('financingPlans').findOne({
      _id: new ObjectId(planId),
      userId: session.user.id,
      status: 'active',
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found or already settled' }, { status: 404 })
    }

    // Cash out: the points already spent covered the product.
    // Cancel remaining installments — user accepts zero points balance.
    const remainingInstallments = plan.installments - plan.paidInstallments

    await db.collection('financingPlans').updateOne(
      { _id: new ObjectId(planId) },
      {
        $set: {
          status: 'cashed_out',
          cashedOutAt: new Date(),
          remainingCancelled: remainingInstallments,
          updatedAt: new Date(),
        },
      }
    )

    // Deduct remaining points value (card share minus what was already paid)
    const alreadyPaid = plan.paidInstallments * plan.installmentAmount
    const remainingCardDebt = plan.cardShare - alreadyPaid

    // The points that were used for this purchase remain spent,
    // and the remaining card debt is forgiven (covered by points).
    // Deduct additional points equal to remaining debt.
    if (remainingCardDebt > 0) {
      await db.collection('pointsBalances').updateOne(
        { userId: session.user.id },
        { $inc: { balance: -remainingCardDebt }, $set: { updatedAt: new Date() } }
      )
      await db.collection('pointsTransactions').insertOne({
        userId: session.user.id,
        type: 'cashout',
        amount: -remainingCardDebt,
        description: `Cashed out: ${plan.merchantName} — remaining $${remainingCardDebt.toFixed(2)} covered by points`,
        financingPlanId: planId,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: `Cashed out! ${remainingInstallments} remaining payments cancelled. Points used to cover the purchase.`,
    })
  } catch (error) {
    console.error('Cashout error:', error)
    return NextResponse.json(
      { error: 'Failed to process cash out' },
      { status: 500 }
    )
  }
}
