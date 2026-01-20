import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, updateSubscription, getSubscriptionByCustomerId } from '@/lib/stripe';
import { getPlanByStripePriceId, type PlanId } from '@/components/sections/pricing/data';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      // =======================================================================
      // 1. CHECKOUT COMPLETADO - Usuario completa el pago inicial
      // =======================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout completed:', session.id);

        // El webhook de subscription.created manejará la actualización
        // Aquí solo logueamos para tracking
        break;
      }

      // =======================================================================
      // 2. SUSCRIPCIÓN CREADA - Nueva suscripción (incluye inicio de trial)
      // =======================================================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      // =======================================================================
      // 3. SUSCRIPCIÓN ACTUALIZADA - Cambio de plan, renovación, fin de trial
      // =======================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // =======================================================================
      // 4. SUSCRIPCIÓN ELIMINADA - Cancelación efectiva
      // =======================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      // =======================================================================
      // 5. PAGO FALLIDO - Fallo en el cobro
      // =======================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HANDLERS
// =============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanByStripePriceId(priceId) : null;

  // Acceder a los períodos desde items (Stripe API v20+)
  const currentPeriodStart = (subscription as any).current_period_start;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log('Subscription created:', {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    planId: plan?.id,
  });

  await updateSubscription(customerId, {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    planId: (plan?.id as PlanId) || 'free',
    status: subscription.status,
    trialStartedAt: subscription.trial_start
      ? new Date(subscription.trial_start * 1000)
      : null,
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    currentPeriodStart: currentPeriodStart
      ? new Date(currentPeriodStart * 1000)
      : null,
    currentPeriodEnd: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? getPlanByStripePriceId(priceId) : null;

  // Acceder a los períodos (Stripe API v20+)
  const currentPeriodStart = (subscription as any).current_period_start;
  const currentPeriodEnd = (subscription as any).current_period_end;

  console.log('Subscription updated:', {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    planId: plan?.id,
  });

  // Determinar el estado correcto
  let status = subscription.status;

  // Si está cancelado pero aún activo hasta fin de período
  if (subscription.cancel_at_period_end && subscription.status === 'active') {
    status = 'active'; // Mantener activo hasta que expire
  }

  await updateSubscription(customerId, {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    planId: (plan?.id as PlanId) || 'free',
    status,
    trialStartedAt: subscription.trial_start
      ? new Date(subscription.trial_start * 1000)
      : null,
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    currentPeriodStart: currentPeriodStart
      ? new Date(currentPeriodStart * 1000)
      : null,
    currentPeriodEnd: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log('Subscription deleted:', {
    subscriptionId: subscription.id,
    customerId,
  });

  // Resetear a plan free
  await updateSubscription(customerId, {
    stripeSubscriptionId: null,
    stripePriceId: null,
    planId: 'free',
    status: 'canceled',
    trialStartedAt: null,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    canceledAt: new Date(),
    cancelAtPeriodEnd: false,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = (invoice as any).subscription as string;

  console.log('Payment failed:', {
    invoiceId: invoice.id,
    customerId,
    subscriptionId,
    attemptCount: invoice.attempt_count,
  });

  // Verificar que existe la suscripción
  const existingSub = await getSubscriptionByCustomerId(customerId);
  if (!existingSub) {
    console.log('No subscription found for customer:', customerId);
    return;
  }

  // Marcar como past_due
  await updateSubscription(customerId, {
    status: 'past_due',
  });
}
