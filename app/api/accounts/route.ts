import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const accounts = await db
      .collection('linkedAccounts')
      .find({ userId: session.user.id, isActive: true })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Fetch accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountId } = await request.json()
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const db = await getDb()
    await db.collection('linkedAccounts').updateOne(
      { _id: new ObjectId(accountId), userId: session.user.id },
      { $set: { isActive: false, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to remove account' },
      { status: 500 }
    )
  }
}
