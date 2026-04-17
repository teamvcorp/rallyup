import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { getDb } from '@/lib/mongodb'

// Disable body parsing — Stripe needs the raw body to verify signatures
export const runtime = 'nodejs'

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const arrayBuffer = await request.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await getRawBody(request)
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = await getDb()

  try {
    switch (event.type) {
      // ── Issuing: real-time authorization decision ──────────────────
      case 'issuing_authorization.request': {
        const auth = event.data.object as Stripe.Issuing.Authorization
        const amount = auth.pending_request?.amount ?? auth.amount
        const amountDollars = amount / 100

        // Find user by card
        const user = await db.collection('users').findOne({
          stripeIssuingCardId: auth.card.id,
        })

        if (!user) {
          await stripe.issuing.authorizations.decline(auth.id)
          break
        }

        // Get user's payment split settings
        const cardPayPercent = user.cardPayPercent ?? 75
        const pointsPercent = 100 - cardPayPercent
        const installmentPlan = user.installmentPlan ?? 4

        // Get points balance
        const balance = await db.collection('pointsBalances').findOne({
          userId: user._id.toString(),
        })

        const totalPoints = balance?.balance ?? 0
        // 10% company cut — user can only access 90% of their points
        const userPoints = totalPoints * 0.9
        // Pro Shopper gets 100% of accessible points, free tier gets 50%
        const isPro = user.proShopperStatus === 'active'
        const accessiblePoints = isPro ? userPoints : userPoints * 0.5
        const financingLimit = accessiblePoints * 0.25

        // Calculate split
        const pointsShare = (amountDollars * pointsPercent) / 100
        const cardShare = amountDollars - pointsShare

        // Check: points share can't exceed 25% of accessible points
        if (pointsShare > financingLimit) {
          await stripe.issuing.authorizations.decline(auth.id)
          await db.collection('webhookLogs').insertOne({
            eventId: event.id,
            type: event.type,
            userId: user._id.toString(),
            action: 'declined',
            reason: `Points share $${pointsShare.toFixed(2)} exceeds financing limit $${financingLimit.toFixed(2)} (${isPro ? 'Pro' : 'Free'} tier, accessible: $${accessiblePoints.toFixed(2)})`,
            createdAt: new Date(),
          })
          break
        }

        // Check: user must have a linked payment method for the card share
        if (cardShare > 0 && !user.stripeCustomerId) {
          await stripe.issuing.authorizations.decline(auth.id)
          await db.collection('webhookLogs').insertOne({
            eventId: event.id,
            type: event.type,
            userId: user._id.toString(),
            action: 'declined',
            reason: 'No linked payment method for debit card charge',
            createdAt: new Date(),
          })
          break
        }

        // Approve the virtual card authorization
        await stripe.issuing.authorizations.approve(auth.id)

        // Deduct points immediately
        if (pointsShare > 0) {
          await db.collection('pointsBalances').updateOne(
            { userId: user._id.toString() },
            { $inc: { balance: -pointsShare }, $set: { updatedAt: new Date() } }
          )
          await db.collection('pointsTransactions').insertOne({
            userId: user._id.toString(),
            type: 'redemption',
            amount: -pointsShare,
            description: `Purchase at ${auth.merchant_data?.name ?? 'merchant'} — points portion`,
            authorizationId: auth.id,
            createdAt: new Date(),
          })
        }

        // Charge real debit card (first installment or full if installmentPlan = 1)
        if (cardShare > 0 && user.stripeCustomerId) {
          const installmentAmount = Math.round((cardShare / installmentPlan) * 100) // in cents

          // Create financing record
          const plan = await db.collection('financingPlans').insertOne({
            userId: user._id.toString(),
            authorizationId: auth.id,
            totalAmount: amountDollars,
            cardShare,
            pointsShare,
            installments: installmentPlan,
            installmentAmount: installmentAmount / 100,
            paidInstallments: 0,
            status: 'active',
            merchantName: auth.merchant_data?.name ?? 'Unknown',
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          // Charge first installment immediately
          try {
            const pi = await stripe.paymentIntents.create({
              amount: installmentAmount,
              currency: 'usd',
              customer: user.stripeCustomerId,
              payment_method_types: ['card'],
              off_session: true,
              confirm: true,
              metadata: {
                financingPlanId: plan.insertedId.toString(),
                installmentNumber: '1',
                totalInstallments: String(installmentPlan),
              },
            })

            await db.collection('financingPayments').insertOne({
              financingPlanId: plan.insertedId.toString(),
              userId: user._id.toString(),
              stripePaymentIntentId: pi.id,
              amount: installmentAmount / 100,
              installmentNumber: 1,
              status: pi.status === 'succeeded' ? 'completed' : 'pending',
              createdAt: new Date(),
            })

            if (pi.status === 'succeeded') {
              await db.collection('financingPlans').updateOne(
                { _id: plan.insertedId },
                { $set: { paidInstallments: 1, updatedAt: new Date() } }
              )
            }
          } catch (chargeErr) {
            console.error('First installment charge failed:', chargeErr)
            // Authorization already approved — log for manual follow-up
            await db.collection('webhookLogs').insertOne({
              eventId: event.id,
              type: 'installment_charge_failed',
              userId: user._id.toString(),
              financingPlanId: plan.insertedId.toString(),
              error: chargeErr instanceof Error ? chargeErr.message : 'Unknown',
              createdAt: new Date(),
            })
          }
        }

        await db.collection('webhookLogs').insertOne({
          eventId: event.id,
          type: event.type,
          userId: user._id.toString(),
          action: 'approved',
          amount: amountDollars,
          cardShare,
          pointsShare,
          installmentPlan,
          merchantName: auth.merchant_data?.name,
          createdAt: new Date(),
        })
        break
      }

      // ── Issuing: authorization created (logged) ────────────────────
      case 'issuing_authorization.created': {
        const auth = event.data.object as Stripe.Issuing.Authorization
        await db.collection('webhookLogs').insertOne({
          eventId: event.id,
          type: event.type,
          cardId: auth.card.id,
          amount: auth.amount / 100,
          status: auth.status,
          merchantName: auth.merchant_data?.name,
          createdAt: new Date(),
        })
        break
      }

      // ── Issuing: settled transaction ───────────────────────────────
      case 'issuing_transaction.created': {
        const txn = event.data.object as Stripe.Issuing.Transaction
        const user = await db.collection('users').findOne({
          stripeIssuingCardId: txn.card,
        })

        if (!user) break

        const amountDollars = Math.abs(txn.amount) / 100

        await db.collection('issuingTransactions').insertOne({
          userId: user._id.toString(),
          stripeTransactionId: txn.id,
          amount: amountDollars,
          merchantName: txn.merchant_data?.name ?? 'Unknown',
          merchantCategory: txn.merchant_data?.category,
          authorizationId: txn.authorization,
          createdAt: new Date(),
        })
        break
      }

      // ── Financing auto-pay succeeded ───────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const paymentId = pi.metadata?.financingPaymentId
        if (!paymentId) break // not a financing payment

        await db.collection('financingPayments').updateOne(
          { _id: paymentId },
          { $set: { status: 'completed', updatedAt: new Date() } }
        )

        // Check if plan is fully paid
        const payment = await db.collection('financingPayments').findOne({ _id: paymentId })
        if (payment) {
          const plan = await db.collection('financingPlans').findOne({
            _id: payment.financingPlanId,
          })
          if (plan) {
            const completedCount = await db.collection('financingPayments').countDocuments({
              financingPlanId: plan._id.toString(),
              status: 'completed',
            })
            if (completedCount >= plan.installments) {
              await db.collection('financingPlans').updateOne(
                { _id: plan._id },
                { $set: { status: 'completed', updatedAt: new Date() } }
              )
            } else {
              await db.collection('financingPlans').updateOne(
                { _id: plan._id },
                {
                  $set: { paidInstallments: completedCount, updatedAt: new Date() },
                }
              )
            }
          }
        }
        break
      }

      // ── Financing auto-pay failed ──────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const paymentId = pi.metadata?.financingPaymentId
        if (!paymentId) break

        await db.collection('financingPayments').updateOne(
          { _id: paymentId },
          {
            $set: {
              status: 'failed',
              failureReason: pi.last_payment_error?.message ?? 'Payment failed',
              updatedAt: new Date(),
            },
          }
        )

        // Log for potential defaulting
        const payment = await db.collection('financingPayments').findOne({ _id: paymentId })
        if (payment) {
          const failedCount = await db.collection('financingPayments').countDocuments({
            financingPlanId: payment.financingPlanId,
            status: 'failed',
          })

          // Default plan after 3 consecutive failures
          if (failedCount >= 3) {
            await db.collection('financingPlans').updateOne(
              { _id: payment.financingPlanId },
              { $set: { status: 'defaulted', updatedAt: new Date() } }
            )
          }
        }
        break
      }

      // ── Payment method attached ────────────────────────────────────
      case 'payment_method.attached': {
        const pm = event.data.object as Stripe.PaymentMethod
        if (!pm.customer) break

        const user = await db.collection('users').findOne({
          stripeCustomerId: pm.customer as string,
        })
        if (!user) break

        const card = pm.card
        await db.collection('linkedAccounts').updateOne(
          { stripePaymentMethodId: pm.id },
          {
            $setOnInsert: {
              userId: user._id.toString(),
              provider: 'stripe',
              accountName: card ? `${card.brand} •••• ${card.last4}` : 'Card',
              accountType: 'credit',
              lastFour: card?.last4 ?? '****',
              isActive: true,
              createdAt: new Date(),
            },
            $set: { stripePaymentMethodId: pm.id },
          },
          { upsert: true }
        )
        break
      }

      // ── Payment method detached ────────────────────────────────────
      case 'payment_method.detached': {
        const pm = event.data.object as Stripe.PaymentMethod
        await db.collection('linkedAccounts').updateOne(
          { stripePaymentMethodId: pm.id },
          { $set: { isActive: false, updatedAt: new Date() } }
        )
        break
      }

      default:
        // Unhandled event type — log and move on
        console.log(`Unhandled webhook event: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error)
    // Return 200 anyway to prevent Stripe from retrying for app-level errors
    // Stripe only retries on 4xx/5xx; returning 200 acknowledges receipt
  }

  return NextResponse.json({ received: true })
}
