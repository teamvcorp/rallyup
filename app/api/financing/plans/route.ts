import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

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
    console.error('Fetch plans error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financing plans' },
      { status: 500 }
    )
  }
}
