import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// POST /api/webhooks/payments - Handle payment webhooks from various providers
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('signature') || request.headers.get('x-signature')

    // Verify webhook signature (implementation depends on payment provider)
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { message: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)

    // Handle different payment providers
    const provider = request.headers.get('x-provider') || payload.provider

    switch (provider) {
      case 'stripe':
        return await handleStripeWebhook(payload)
      case 'paypal':
        return await handlePayPalWebhook(payload)
      case 'square':
        return await handleSquareWebhook(payload)
      default:
        return NextResponse.json(
          { message: 'Unsupported payment provider' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false

  // This is a placeholder - implement actual signature verification
  // based on your payment provider's documentation
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) return false

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

async function handleStripeWebhook(payload: any) {
  if (payload.type === 'payment_intent.succeeded') {
    const paymentIntent = payload.data.object

    // Extract user email from metadata
    const userEmail = paymentIntent.metadata?.userEmail
    const amount = paymentIntent.amount / 100 // Stripe uses cents

    if (!userEmail) {
      return NextResponse.json({ message: 'No user email in metadata' }, { status: 400 })
    }

    await processAutoPayment({
      userEmail,
      amount,
      transactionId: paymentIntent.id,
      paymentMethod: 'stripe',
      metadata: paymentIntent.metadata
    })
  }

  return NextResponse.json({ received: true })
}

async function handlePayPalWebhook(payload: any) {
  if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const payment = payload.resource

    // Extract user email from payer info or custom field
    const userEmail = payment.payer?.email_address || payment.custom_id
    const amount = parseFloat(payment.amount.value)

    if (!userEmail) {
      return NextResponse.json({ message: 'No user email found' }, { status: 400 })
    }

    await processAutoPayment({
      userEmail,
      amount,
      transactionId: payment.id,
      paymentMethod: 'paypal',
      metadata: payment
    })
  }

  return NextResponse.json({ received: true })
}

async function handleSquareWebhook(payload: any) {
  if (payload.type === 'payment.created') {
    const payment = payload.data.object.payment

    // Extract user email from note or reference_id
    const userEmail = payment.note || payment.reference_id
    const amount = payment.total_money.amount / 100 // Square uses cents

    if (!userEmail) {
      return NextResponse.json({ message: 'No user email found' }, { status: 400 })
    }

    await processAutoPayment({
      userEmail,
      amount,
      transactionId: payment.id,
      paymentMethod: 'square',
      metadata: payment
    })
  }

  return NextResponse.json({ received: true })
}

interface AutoPaymentData {
  userEmail: string
  amount: number
  transactionId: string
  paymentMethod: string
  metadata?: any
}

async function processAutoPayment(data: AutoPaymentData) {
  const { userEmail, amount, transactionId, paymentMethod } = data

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.error(`User not found for email: ${userEmail}`)
      return
    }

    // Check if payment already processed
    const existingPayment = await prisma.payment.findUnique({
      where: { transactionId }
    })

    if (existingPayment) {
      console.log(`Payment already processed: ${transactionId}`)
      return
    }

    // USD-based wallet: $1 deposit = $1 balance
    // Keep tokens field for backward compatibility by mirroring USD amount
    const tokensToAdd = amount

    // Process payment in transaction
    await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          userId: user.id,
          amount,
          tokens: tokensToAdd,
          transactionId,
          paymentMethod,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        }
      })

      // Add USD to user's balance (virtualBalance is stored in USD)
      await tx.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: {
            increment: tokensToAdd,
          },
        },
      })
    })

    console.log(`Auto-processed payment: ${amount} USD added to balance for ${user.name}`)

    // Optional: Send notification to user about token deposit
    // await sendPaymentConfirmationEmail(user, amount, tokensToAdd)

  } catch (error) {
    console.error('Error processing auto payment:', error)
    throw error
  }
}