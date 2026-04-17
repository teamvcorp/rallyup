import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateFields: Record<string, unknown> = { updatedAt: new Date() }

    if (body.roundUpPreference && ['half', 'whole'].includes(body.roundUpPreference)) {
      updateFields.roundUpPreference = body.roundUpPreference
    }

    if (typeof body.autoPaymentEnabled === 'boolean') {
      updateFields.autoPaymentEnabled = body.autoPaymentEnabled
    }

    if (body.name) {
      updateFields.name = body.name
    }

    const db = await getDb()
    await db.collection('users').updateOne(
      { _id: session.user.id },
      { $set: updateFields }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const user = await db.collection('users').findOne(
      { _id: session.user.id },
      { projection: { passwordHash: 0, plaidAccessToken: 0 } }
    )

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
