/**
 * Fichero maestro de planes de suscripción.
 * Aquí se definen todos los planes disponibles con sus características,
 * límites y configuración de Stripe.
 */

export type PlanInterval = 'monthly' | 'yearly';

export type PlanId = 'free' | 'plus' | 'pro';

export interface PlanPrice {
  monthly: number;
  yearly: number;
}

export interface PlanStripePriceId {
  monthly: string | undefined;
  yearly: string | undefined;
}

export interface PlanLimits {
  generations: number; // -1 = ilimitado
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: PlanPrice | null;
  features: string[];
  limits: PlanLimits;
  stripePriceId: PlanStripePriceId | null;
  trialDays: number | null;
  isPopular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Para empezar a explorar',
    price: null,
    features: [
      '5 generaciones al mes',
      'Modelos básicos',
      'Soporte por email',
    ],
    limits: {
      generations: 5,
    },
    stripePriceId: null,
    trialDays: null,
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    description: 'Para profesionales',
    price: {
      monthly: 15,
      yearly: 144, // 12€/mes (20% descuento)
    },
    features: [
      '100 generaciones al mes',
      'Todos los modelos',
      'Soporte prioritario',
      'Historial ilimitado',
    ],
    limits: {
      generations: 100,
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
    },
    trialDays: 14,
    isPopular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para equipos y empresas',
    price: {
      monthly: 40,
      yearly: 384, // 32€/mes (20% descuento)
    },
    features: [
      'Generaciones ilimitadas',
      'Todos los modelos + early access',
      'Soporte 24/7',
      'API access',
      'Integraciones avanzadas',
    ],
    limits: {
      generations: -1, // ilimitado
    },
    stripePriceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    trialDays: 7,
  },
};

/**
 * Obtiene un plan por su ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

/**
 * Obtiene el plan por el Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): Plan | null {
  for (const plan of Object.values(PLANS)) {
    if (
      plan.stripePriceId?.monthly === stripePriceId ||
      plan.stripePriceId?.yearly === stripePriceId
    ) {
      return plan;
    }
  }
  return null;
}

/**
 * Comprueba si un plan tiene trial
 */
export function planHasTrial(planId: PlanId): boolean {
  const plan = PLANS[planId];
  return plan.trialDays !== null && plan.trialDays > 0;
}

/**
 * Obtiene todos los planes como array (útil para renderizar)
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Obtiene los planes de pago (excluye free)
 */
export function getPaidPlans(): Plan[] {
  return Object.values(PLANS).filter((plan) => plan.stripePriceId !== null);
}
