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

    const { paymentMethodId } = await request.json()

    // Retrieve the payment method — it's already attached to a customer via SetupIntent
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const customerId = pm.customer as string | null

    if (!customerId) {
      return NextResponse.json(
        { error: 'Payment method is not attached to a customer' },
        { status: 400 }
      )
    }

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Make sure user record has this customer ID
    const db = await getDb()
    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { stripeCustomerId: customerId, updatedAt: new Date() } }
    )

    // Store linked account
    await db.collection('linkedAccounts').updateOne(
      { stripePaymentMethodId: paymentMethodId },
      {
        $setOnInsert: {
          userId: session.user.id,
          provider: 'stripe',
          accountName: pm.card?.brand || pm.type,
          accountType: pm.type === 'us_bank_account' ? 'checking' : 'credit',
          lastFour: pm.card?.last4 || pm.us_bank_account?.last4 || '****',
          stripePaymentMethodId: paymentMethodId,
          isActive: true,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, customerId })
  } catch (error) {
    console.error('Stripe connect error:', error)
    return NextResponse.json(
      { error: 'Failed to connect payment method' },
      { status: 500 }
    )
  }
}
