import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, stripe, updateSubscription } from '@/lib/stripe';
import { getPlanByStripePriceId, type PlanId } from '@/config/plans';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// =============================================================================
// POST - Crear sesión de checkout
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para suscribirte' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Se requiere un priceId' },
        { status: 400 }
      );
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      priceId,
      // Redirige de vuelta a este endpoint para procesar la sesión
      successUrl: `${APP_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_URL}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Manejar retorno de Stripe después del checkout exitoso
// =============================================================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    // Recuperar la sesión de Stripe con datos expandidos
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription'],
    });

    if (!session.customer || typeof session.customer === 'string') {
      throw new Error('Invalid customer data from Stripe');
    }

    const customerId = session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      throw new Error('No subscription found for this session');
    }

    // Recuperar la suscripción con detalles del precio/producto
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId ? getPlanByStripePriceId(priceId) : null;

    // Acceder a los períodos (Stripe API v20+)
    const currentPeriodStart = (subscription as any).current_period_start;
    const currentPeriodEnd = (subscription as any).current_period_end;

    // Actualizar la suscripción en la base de datos
    await updateSubscription(customerId, {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      planId: (plan?.id as PlanId) || 'plus',
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

    // Redirigir al dashboard con mensaje de éxito
    return NextResponse.redirect(
      new URL('/dashboard?checkout=success', request.url)
    );
  } catch (error) {
    console.error('Error handling successful checkout:', error);
    return NextResponse.redirect(
      new URL('/pricing?checkout=error', request.url)
    );
  }
}
