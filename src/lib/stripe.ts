import Stripe from 'stripe';
import { db } from '@/db';
import { userSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  BILLING_PLANS,
  getPlanByStripePriceId,
  type PlanId,
  type TBILLING_PLAN,
} from '@/components/sections/pricing/data';

// =============================================================================
// STRIPE CLIENT
// =============================================================================
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// =============================================================================
// CUSTOMER MANAGEMENT
// =============================================================================

/**
 * Obtiene o crea un cliente de Stripe para un usuario
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  // Buscar suscripción existente con customerId
  const existingSubscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (existingSubscription[0]?.stripeCustomerId) {
    return existingSubscription[0].stripeCustomerId;
  }

  // Crear nuevo cliente en Stripe
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Crear o actualizar registro de suscripción con el customerId
  await db
    .insert(userSubscriptions)
    .values({
      userId,
      stripeCustomerId: customer.id,
      planId: 'free',
      status: 'inactive',
    })
    .onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    });

  return customer.id;
}

// =============================================================================
// CHECKOUT SESSION
// =============================================================================

interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  name?: string | null;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Crea una sesión de checkout de Stripe para suscripción
 */
export async function createCheckoutSession({
  userId,
  email,
  name,
  priceId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateStripeCustomer(userId, email, name);

  // Obtener el plan para ver si tiene trial
  const plan = getPlanByStripePriceId(priceId);
  const trialDays = plan?.trialDays || null;

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      userId,
    },
  };

  // Añadir trial si el plan lo tiene
  if (trialDays && trialDays > 0) {
    sessionConfig.subscription_data = {
      trial_period_days: trialDays,
    };
  }

  return stripe.checkout.sessions.create(sessionConfig);
}

// =============================================================================
// CUSTOMER PORTAL
// =============================================================================

/**
 * Crea una sesión del portal de cliente de Stripe
 */
export async function createCustomerPortalSession(
  userId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const subscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (!subscription[0]?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this user');
  }

  // Obtener o crear configuración del portal
  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    // Crear configuración programáticamente
    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Gestiona tu suscripción',
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'promotion_code'],
          proration_behavior: 'create_prorations',
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ],
          },
        },
        payment_method_update: {
          enabled: true,
        },
        invoice_history: {
          enabled: true,
        },
      },
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: subscription[0].stripeCustomerId,
    return_url: returnUrl,
    configuration: configuration.id,
  });
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Obtiene la suscripción de un usuario
 */
export async function getUserSubscription(userId: string) {
  const subscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  return subscription[0] || null;
}

/**
 * Obtiene la suscripción por Stripe Customer ID
 */
export async function getSubscriptionByCustomerId(customerId: string) {
  const subscription = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeCustomerId, customerId))
    .limit(1);

  return subscription[0] || null;
}

/**
 * Actualiza la suscripción en la base de datos
 */
export async function updateSubscription(
  stripeCustomerId: string,
  data: Partial<{
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    planId: PlanId;
    status: string;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    canceledAt: Date | null;
    cancelAtPeriodEnd: boolean;
  }>
) {
  await db
    .update(userSubscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeCustomerId, stripeCustomerId));
}

// =============================================================================
// SUBSCRIPTION STATUS HELPERS
// =============================================================================

/**
 * Verifica si el usuario tiene una suscripción activa (incluyendo trial)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;

  return (
    subscription.status === 'active' || subscription.status === 'trialing'
  );
}

/**
 * Verifica si el usuario está en período de prueba
 */
export async function isInTrial(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription?.status === 'trialing';
}

/**
 * Obtiene el plan actual del usuario
 */
export async function getCurrentPlan(userId: string): Promise<TBILLING_PLAN> {
  const subscription = await getUserSubscription(userId);
  const planId = (subscription?.planId as PlanId) || 'free';
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  return plan || BILLING_PLANS[0]; // fallback to free
}

/**
 * Verifica si el usuario puede acceder a una feature según su plan
 */
export async function canAccessFeature(
  userId: string,
  requiredPlan: PlanId
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription || subscription.status === 'inactive') {
    return requiredPlan === 'free';
  }

  const planHierarchy: Record<PlanId, number> = {
    free: 0,
    plus: 1,
    pro: 2,
  };

  const userPlanLevel = planHierarchy[subscription.planId as PlanId] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan];

  return userPlanLevel >= requiredPlanLevel;
}
