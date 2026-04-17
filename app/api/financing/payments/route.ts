import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    const db = await getDb()
    const plan = await db.collection('financingPlans').findOne({
      _id: new ObjectId(planId),
      userId: session.user.id,
      status: 'active',
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Financing plan not found' },
        { status: 404 }
      )
    }

    if (plan.paidInstallments >= plan.installments) {
      return NextResponse.json(
        { error: 'All installments already paid' },
        { status: 400 }
      )
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No payment method on file' },
        { status: 400 }
      )
    }

    // Charge the installment via Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.installmentAmount * 100),
      currency: 'usd',
      customer: user.stripeCustomerId,
      off_session: true,
      confirm: true,
      description: `RallyUp - ${plan.itemDescription} (${plan.paidInstallments + 1}/${plan.installments})`,
    })

    // Record the payment
    await db.collection('financingPayments').insertOne({
      financingPlanId: planId,
      userId: session.user.id,
      amount: plan.installmentAmount,
      installmentNumber: plan.paidInstallments + 1,
      status: 'completed',
      stripePaymentIntentId: paymentIntent.id,
      createdAt: new Date(),
    })

    // Update the plan
    const newPaidInstallments = plan.paidInstallments + 1
    const nextPaymentDate = new Date()
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 14)

    await db.collection('financingPlans').updateOne(
      { _id: new ObjectId(planId) },
      {
        $set: {
          paidInstallments: newPaidInstallments,
          status:
            newPaidInstallments >= plan.installments ? 'completed' : 'active',
          nextPaymentDate,
        },
      }
    )

    return NextResponse.json({
      success: true,
      paidInstallments: newPaidInstallments,
      remaining: plan.installments - newPaidInstallments,
    })
  } catch (error) {
    console.error('Financing payment error:', error)
    return NextResponse.json(
      { error: 'Payment failed' },
      { status: 500 }
    )
  }
}
