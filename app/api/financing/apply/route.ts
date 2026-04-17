import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemDescription, totalAmount, installments } = await request.json()

    // Validate installments
    if (![4, 8, 12].includes(installments)) {
      return NextResponse.json(
        { error: 'Installments must be 4, 8, or 12' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Get current points balance
    const balance = await db.collection('pointsBalances').findOne({
      userId: session.user.id,
    })

    if (!balance || balance.balance <= 0) {
      return NextResponse.json(
        { error: 'Insufficient points balance' },
        { status: 400 }
      )
    }

    // Calculate financing limit: 25% of stored points
    const maxFinancingFromPoints = balance.balance * 0.25

    if (totalAmount > maxFinancingFromPoints + balance.balance) {
      return NextResponse.json(
        { error: 'Purchase amount exceeds your financing capacity' },
        { status: 400 }
      )
    }

    // Check 12-month round-up cap
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const twelveMonthRoundUps = await db
      .collection('roundUpTransactions')
      .aggregate([
        {
          $match: {
            userId: session.user.id,
            status: 'completed',
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalRoundedUp: { $sum: '$roundUpAmount' },
          },
        },
      ])
      .toArray()

    const totalRoundedUp12Months = twelveMonthRoundUps[0]?.totalRoundedUp || 0

    // Check existing active financing
    const activeFinancing = await db
      .collection('financingPlans')
      .aggregate([
        {
          $match: {
            userId: session.user.id,
            status: 'active',
          },
        },
        {
          $group: {
            _id: null,
            totalFinanced: { $sum: '$financedAmount' },
          },
        },
      ])
      .toArray()

    const currentlyFinanced = activeFinancing[0]?.totalFinanced || 0

    if (currentlyFinanced + totalAmount > totalRoundedUp12Months) {
      return NextResponse.json(
        {
          error: `Total financing cannot exceed your 12-month round-up total of $${totalRoundedUp12Months.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Calculate the plan
    const pointsUsedAsDownPayment = Math.min(
      balance.balance,
      totalAmount * 0.25
    )
    const financedAmount = totalAmount - pointsUsedAsDownPayment
    const installmentAmount = financedAmount / installments

    // Create financing plan
    const plan = {
      userId: session.user.id,
      itemDescription,
      totalAmount,
      pointsUsedAsDownPayment,
      financedAmount,
      installments,
      installmentAmount: Math.ceil(installmentAmount * 100) / 100,
      paidInstallments: 0,
      status: 'active' as const,
      createdAt: new Date(),
      nextPaymentDate: getNextPaymentDate(),
    }

    const result = await db.collection('financingPlans').insertOne(plan)

    // Deduct points used as down payment
    await db.collection('pointsBalances').updateOne(
      { userId: session.user.id },
      {
        $inc: {
          balance: -pointsUsedAsDownPayment,
          totalSpent: pointsUsedAsDownPayment,
        },
        $set: { updatedAt: new Date() },
      }
    )

    return NextResponse.json({
      success: true,
      planId: result.insertedId,
      plan: {
        ...plan,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error('Financing application error:', error)
    return NextResponse.json(
      { error: 'Failed to create financing plan' },
      { status: 500 }
    )
  }
}

function getNextPaymentDate(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 14) // First payment in 2 weeks
  return date
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const plans = await db
      .collection('financingPlans')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Financing plans fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financing plans' },
      { status: 500 }
    )
  }
}
