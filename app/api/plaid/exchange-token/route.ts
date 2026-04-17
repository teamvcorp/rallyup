import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { plaidClient } from '@/lib/plaid'
import { getDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { publicToken, metadata } = await request.json()

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const { access_token, item_id } = exchangeResponse.data

    const db = await getDb()

    // Update user with Plaid credentials
    await db.collection('users').updateOne(
      { _id: session.user.id },
      {
        $set: {
          plaidAccessToken: access_token,
          plaidItemId: item_id,
          updatedAt: new Date(),
        },
      }
    )

    // Store linked accounts
    if (metadata?.accounts) {
      const accounts = metadata.accounts.map((account: { id: string; name: string; type: string; mask: string; }) => ({
        userId: session.user!.id,
        provider: 'plaid' as const,
        accountName: account.name,
        accountType: account.type,
        lastFour: account.mask,
        institutionName: metadata.institution?.name,
        plaidAccountId: account.id,
        isActive: true,
        createdAt: new Date(),
      }))

      await db.collection('linkedAccounts').insertMany(accounts)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plaid exchange error:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
