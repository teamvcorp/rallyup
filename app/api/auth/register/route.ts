import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const db = await getDb()

    // Ensure unique index on email (idempotent)
    await db.collection('users').createIndex({ email: 1 }, { unique: true })

    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase(),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = {
      email: email.toLowerCase(),
      name,
      passwordHash,
      roundUpPreference: 'whole' as const,
      autoPaymentEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(user)

    // Create initial points balance
    await db.collection('pointsBalances').insertOne({
      userId: result.insertedId.toString(),
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      updatedAt: new Date(),
    })

    return NextResponse.json(
      { message: 'Account created successfully', userId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
