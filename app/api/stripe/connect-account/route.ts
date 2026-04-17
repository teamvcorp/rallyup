import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: session.user.id })

    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
      })
      customerId = customer.id

      await db.collection('users').updateOne(
        { _id: session.user.id },
        { $set: { stripeCustomerId: customerId, updatedAt: new Date() } }
      )
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Store linked account
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    await db.collection('linkedAccounts').insertOne({
      userId: session.user.id,
      provider: 'stripe',
      accountName: paymentMethod.card?.brand || paymentMethod.type,
      accountType: paymentMethod.type === 'us_bank_account' ? 'checking' : 'credit',
      lastFour: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4 || '****',
      stripePaymentMethodId: paymentMethodId,
      isActive: true,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, customerId })
  } catch (error) {
    console.error('Stripe connect error:', error)
    return NextResponse.json(
      { error: 'Failed to connect payment method' },
      { status: 500 }
    )
  }
}
