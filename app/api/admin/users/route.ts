import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

async function isAdmin() {
  const session = await auth()
  if (!session?.user?.email) return false
  // If no ADMIN_EMAILS configured, allow the first registered user (bootstrap)
  if (ADMIN_EMAILS.length === 0) {
    const db = await getDb()
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })
    return user?.role === 'admin'
  }
  return ADMIN_EMAILS.includes(session.user.email.toLowerCase())
}

// GET — list all users with stats
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = await getDb()

  // Get all users (without passwords)
  const users = await db.collection('users')
    .find({}, { projection: { passwordHash: 0, plaidAccessToken: 0 } })
    .sort({ createdAt: -1 })
    .toArray()

  // Get points balances for all users
  const balances = await db.collection('pointsBalances').find({}).toArray()
  const balanceMap = new Map(balances.map(b => [b.userId, b.balance ?? 0]))

  // Platform stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyAgg = await db.collection('roundUpTransactions').aggregate([
    { $match: { status: 'completed', createdAt: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$roundUpAmount' }, count: { $sum: 1 } } },
  ]).toArray()

  const allTimeAgg = await db.collection('roundUpTransactions').aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$roundUpAmount' }, count: { $sum: 1 } } },
  ]).toArray()

  const activePlans = await db.collection('financingPlans').countDocuments({ status: 'active' })
  const proCount = await db.collection('users').countDocuments({ proShopperStatus: 'active' })

  const usersWithBalances = users.map(u => ({
    ...u,
    pointsBalance: balanceMap.get(u._id.toString()) ?? 0,
  }))

  return NextResponse.json({
    users: usersWithBalances,
    stats: {
      totalUsers: users.length,
      monthlyRoundUps: Math.round((monthlyAgg[0]?.total ?? 0) * 100) / 100,
      monthlyTransactions: monthlyAgg[0]?.count ?? 0,
      allTimeRoundUps: Math.round((allTimeAgg[0]?.total ?? 0) * 100) / 100,
      allTimeTransactions: allTimeAgg[0]?.count ?? 0,
      companyRevenue10Pct: Math.round((allTimeAgg[0]?.total ?? 0) * 0.1 * 100) / 100,
      monthlyCompanyRevenue: Math.round((monthlyAgg[0]?.total ?? 0) * 0.1 * 100) / 100,
      activeFinancingPlans: activePlans,
      proShopperCount: proCount,
      issuingThreshold: 20000,
      issuingProgress: Math.min(100, Math.round(((monthlyAgg[0]?.total ?? 0) / 20000) * 100)),
    },
  })
}

// PATCH — update user (reset password, suspend, set role, etc.)
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, action, value } = body

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action required' }, { status: 400 })
  }

  const db = await getDb()
  let objectId: ObjectId
  try {
    objectId = new ObjectId(userId)
  } catch {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const updateFields: Record<string, unknown> = { updatedAt: new Date() }

  switch (action) {
    case 'suspend':
      updateFields.suspended = true
      updateFields.suspendedAt = new Date()
      break
    case 'unsuspend':
      updateFields.suspended = false
      updateFields.suspendedAt = null
      break
    case 'resetPassword': {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcryptjs')
      const tempPassword = value || 'RallyUp2024!'
      const hash = await bcrypt.hash(tempPassword, 12)
      updateFields.passwordHash = hash
      updateFields.passwordResetRequired = true
      break
    }
    case 'setRole':
      if (!['user', 'admin'].includes(value)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updateFields.role = value
      break
    case 'cancelProShopper':
      updateFields.proShopperStatus = 'cancelled'
      updateFields.proShopperCancelledAt = new Date()
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await db.collection('users').updateOne(
    { _id: objectId },
    { $set: updateFields }
  )

  return NextResponse.json({ success: true, action, userId })
}
