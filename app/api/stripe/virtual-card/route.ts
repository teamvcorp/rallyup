import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: session.user.id })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please add a payment method first.' },
        { status: 400 }
      )
    }

    if (user.stripeIssuingCardId) {
      // Return existing card info
      const card = await stripe.issuing.cards.retrieve(user.stripeIssuingCardId)
      return NextResponse.json({ card })
    }

    // Create a cardholder
    const cardholder = await stripe.issuing.cardholders.create({
      name: session.user.name!,
      email: session.user.email!,
      type: 'individual',
      billing: {
        address: {
          line1: '123 Main St', // TODO: collect real address
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US',
        },
      },
    })

    // Issue virtual card
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: 'usd',
      type: 'virtual',
    })

    await db.collection('users').updateOne(
      { _id: session.user.id },
      { $set: { stripeIssuingCardId: card.id, updatedAt: new Date() } }
    )

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Virtual card creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create virtual card' },
      { status: 500 }
    )
  }
}
