import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    if (!user?.stripeIssuingCardId) {
      return NextResponse.json({ card: null })
    }

    const card = await stripe.issuing.cards.retrieve(user.stripeIssuingCardId)
    return NextResponse.json({ card })
  } catch (error) {
    console.error('Virtual card fetch error:', error)
    return NextResponse.json({ card: null })
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please add a payment method first.' },
        { status: 400 }
      )
    }

    if (user.stripeIssuingCardId) {
      // Existing card — try to activate if inactive
      let card = await stripe.issuing.cards.retrieve(user.stripeIssuingCardId, { expand: ['cardholder'] })
      if (card.status === 'inactive') {
        try {
          card = await stripe.issuing.cards.update(user.stripeIssuingCardId, { status: 'active' })
        } catch (err) {
          // Return the cardholder requirements so the UI can prompt for them
          const cardholder = typeof card.cardholder === 'string'
            ? await stripe.issuing.cardholders.retrieve(card.cardholder)
            : card.cardholder
          const requirements = cardholder.requirements?.disabled_reason
            ? {
                disabledReason: cardholder.requirements.disabled_reason,
                pastDue: cardholder.requirements.past_due ?? [],
              }
            : null
          return NextResponse.json({
            card,
            needsInfo: true,
            requirements,
            cardholderId: cardholder.id,
            error: 'Cardholder information required to activate your card.',
          })
        }
      }
      return NextResponse.json({ card })
    }

    // Create a new cardholder (minimal — user fills in rest)
    const cardholder = await stripe.issuing.cardholders.create({
      name: session.user.name || 'RallyUp User',
      email: session.user.email!,
      type: 'individual',
      billing: {
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US',
        },
      },
    })

    // Issue virtual card (inactive — user activates after providing info)
    const card = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: 'usd',
      type: 'virtual',
    })

    await db.collection('users').updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { stripeIssuingCardId: card.id, stripeCardholderId: cardholder.id, updatedAt: new Date() } }
    )

    // Check requirements
    const requirements = cardholder.requirements?.disabled_reason
      ? {
          disabledReason: cardholder.requirements.disabled_reason,
          pastDue: cardholder.requirements.past_due ?? [],
        }
      : null

    if (requirements) {
      return NextResponse.json({
        card,
        needsInfo: true,
        requirements,
        cardholderId: cardholder.id,
        error: 'Cardholder information required to activate your card.',
      })
    }

    // No requirements — activate immediately
    try {
      const activeCard = await stripe.issuing.cards.update(card.id, { status: 'active' })
      return NextResponse.json({ card: activeCard })
    } catch {
      return NextResponse.json({ card })
    }
  } catch (error) {
    console.error('Virtual card creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create virtual card' },
      { status: 500 }
    )
  }
}

// PUT — update cardholder info and try to activate the card
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardholderId, name, phone, line1, city, state, postalCode } = await request.json()
    if (!cardholderId) {
      return NextResponse.json({ error: 'Missing cardholder ID' }, { status: 400 })
    }

    // Update cardholder with provided info
    const updateParams: Record<string, unknown> = {}
    if (phone) updateParams.phone_number = phone
    if (line1 || city || state || postalCode) {
      updateParams.billing = {
        address: {
          line1: line1 || '123 Main St',
          city: city || 'San Francisco',
          state: state || 'CA',
          postal_code: postalCode || '94111',
          country: 'US',
        },
      }
    }

    // Build individual params (name + terms acceptance)
    const individualParams: Record<string, unknown> = {
      card_issuing: {
        user_terms_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
        },
      },
    }
    if (name) {
      const parts = name.trim().split(/\s+/)
      individualParams.first_name = parts[0]
      individualParams.last_name = parts.slice(1).join(' ') || parts[0]
    }
    updateParams.individual = individualParams

    await stripe.issuing.cardholders.update(cardholderId, updateParams)

    // Now try activating the card
    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

    if (!user?.stripeIssuingCardId) {
      return NextResponse.json({ error: 'No card found' }, { status: 400 })
    }

    try {
      const card = await stripe.issuing.cards.update(user.stripeIssuingCardId, { status: 'active' })
      return NextResponse.json({ card })
    } catch (err) {
      // Still can't activate — fetch updated requirements
      const cardholder = await stripe.issuing.cardholders.retrieve(cardholderId)
      console.error('Activation failed. Requirements:', JSON.stringify(cardholder.requirements))
      console.error('Activation error:', err)
      return NextResponse.json({
        error: 'Additional information still required.',
        needsInfo: true,
        requirements: cardholder.requirements?.disabled_reason
          ? {
              disabledReason: cardholder.requirements.disabled_reason,
              pastDue: cardholder.requirements.past_due ?? [],
            }
          : null,
        cardholderId,
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Cardholder update error:', error)
    return NextResponse.json(
      { error: 'Failed to update cardholder' },
      { status: 500 }
    )
  }
}
