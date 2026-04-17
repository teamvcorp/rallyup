import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { stripe } from '@/lib/stripe'

// POST — subscribe to Pro Shopper ($5/month charged to real debit card)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.proShopperStatus === 'active') {
      return NextResponse.json({ error: 'Already subscribed to Pro Shopper' }, { status: 400 })
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'Please link a payment method first' }, { status: 400 })
    }

    // Charge $5.00 to their real debit card
    const pi = await stripe.paymentIntents.create({
      amount: 500, // $5.00 in cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      off_session: true,
      confirm: true,
      metadata: {
        userId: session.user.id,
        type: 'pro_shopper_subscription',
      },
    })

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment failed. Please check your card.' }, { status: 400 })
    }

    // Activate Pro Shopper
    const now = new Date()
    const nextBilling = new Date(now)
    nextBilling.setMonth(nextBilling.getMonth() + 1)

    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          proShopperStatus: 'active',
          proShopperStartedAt: now,
          proShopperNextBilling: nextBilling,
          updatedAt: now,
        },
      }
    )

    // Log the payment
    await db.collection('subscriptionPayments').insertOne({
      userId: session.user.id,
      stripePaymentIntentId: pi.id,
      amount: 5.0,
      type: 'pro_shopper',
      status: 'completed',
      billingPeriodStart: now,
      billingPeriodEnd: nextBilling,
      createdAt: now,
    })

    return NextResponse.json({
      success: true,
      proShopperStatus: 'active',
      nextBilling: nextBilling.toISOString(),
    })
  } catch (error) {
    console.error('Pro Shopper subscription error:', error)
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 })
  }
}

// DELETE — cancel Pro Shopper subscription
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      {
        $set: {
          proShopperStatus: 'cancelled',
          proShopperCancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true, proShopperStatus: 'cancelled' })
  } catch (error) {
    console.error('Pro Shopper cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
