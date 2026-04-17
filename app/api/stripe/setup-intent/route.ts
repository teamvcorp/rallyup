import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    let customerId = user?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
      })
      customerId = customer.id

      await db.collection('users').updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { stripeCustomerId: customerId, updatedAt: new Date() } }
      )
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (error) {
    console.error('Setup intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}
