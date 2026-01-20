export const BILLING_PERIODS = [
  {
    label: 'Monthly',
    key: 'monthly',
    saving: null,
  },
  {
    label: 'Annually',
    key: 'yearly',
    saving: '20%',
  },
] as const;

const AMOUNTS = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  plus: {
    monthly: 15,
    yearly: 144,
  },
  pro: {
    monthly: 40,
    yearly: 384,
  },
  enterprise: {
    monthly: null,
    yearly: null,
  },
};

// Plan types - PlanId is for Stripe-enabled plans only
export type PlanType = 'free' | 'plus' | 'pro' | 'enterprise';
export type PlanId = 'free' | 'plus' | 'pro'; // Excludes enterprise (no Stripe)
export type PlanInterval = 'monthly' | 'yearly';
export type TBILLING_PLAN = (typeof BILLING_PLANS)[number];

export const BILLING_PLANS = [
  {
    id: 'free' as PlanType,
    name: 'Free',
    description:
      'For hobbyists exploring AI—get started with essential features and a small token allowance.',
    pricing: {
      monthly: {
        amount: AMOUNTS['free']['monthly'],
        formattedPrice: '$' + AMOUNTS['free']['monthly'],
        stripeId: null,
      },
      yearly: {
        amount: AMOUNTS['free']['yearly'],
        formattedPrice: '$' + AMOUNTS['free']['yearly'],
        stripeId: null,
      },
    },
    features: [
      'Basic AI model access',
      'Up to 25,000 tokens / month',
      'Limited to 3 projects',
      'No API key support',
      'Community support only',
    ],
    limits: {
      tokens: 25000,
      projects: 3,
    },
    cta: 'Try it for free',
    popular: false,
    trialDays: null,
  },
  {
    id: 'plus' as PlanType,
    name: 'Plus plan',
    description:
      'For developers building real products—higher limits and more flexible usage.',
    pricing: {
      monthly: {
        amount: AMOUNTS['plus']['monthly'],
        formattedPrice: '$' + AMOUNTS['plus']['monthly'],
        stripeId: process.env.NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID || null,
      },
      yearly: {
        amount: AMOUNTS['plus']['yearly'],
        formattedPrice: '$' + AMOUNTS['plus']['yearly'],
        stripeId: process.env.NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID || null,
      },
    },
    features: [
      'Everything in Free',
      'Up to 250,000 tokens / month',
      'Unlimited projects',
      'Bring your own OpenAI API key',
      'Basic analytics dashboard',
      'Email support',
    ],
    limits: {
      tokens: 250000,
      projects: -1, // unlimited
    },
    cta: 'Start 14-day trial',
    popular: true,
    trialDays: 14,
  },
  {
    id: 'pro' as PlanType,
    name: 'Pro plan',
    description:
      'For teams and power users who need generous token limits and advanced tooling.',
    pricing: {
      monthly: {
        amount: AMOUNTS['pro']['monthly'],
        formattedPrice: '$' + AMOUNTS['pro']['monthly'],
        stripeId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || null,
      },
      yearly: {
        amount: AMOUNTS['pro']['yearly'],
        formattedPrice: '$' + AMOUNTS['pro']['yearly'],
        stripeId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || null,
      },
    },
    features: [
      'Everything in Plus',
      'Up to 1 million tokens / month',
      'Advanced model selection (GPT-4, Claude 3)',
      'Priority support',
      'Team collaboration tools',
      'Exportable usage reports',
    ],
    limits: {
      tokens: 1000000,
      projects: -1, // unlimited
    },
    cta: 'Start 7-day trial',
    popular: false,
    trialDays: 7,
  },
  {
    id: 'enterprise' as PlanType,
    name: 'Enterprise',
    description:
      'Tailored for companies with high-volume needs and advanced security.',
    pricing: {
      monthly: {
        amount: AMOUNTS['enterprise']['monthly'],
        formattedPrice: "Let's talk",
        stripeId: null,
      },
      yearly: {
        amount: AMOUNTS['enterprise']['yearly'],
        formattedPrice: "Let's talk",
        stripeId: null,
      },
    },
    features: [
      'Everything in Pro',
      'Unlimited tokens',
      'Dedicated AI instance (optional)',
      'SLA-backed support (24/7)',
      'SSO & audit logging',
    ],
    limits: {
      tokens: -1, // unlimited
      projects: -1, // unlimited
    },
    cta: 'Contact sales',
    popular: false,
    trialDays: null,
  },
];

// =============================================================================
// HELPER FUNCTIONS (used by Stripe integration)
// =============================================================================

/**
 * Get a plan by its ID
 */
export function getPlan(planId: PlanId): TBILLING_PLAN {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    return BILLING_PLANS[0]; // Return free plan as fallback
  }
  return plan;
}

/**
 * Get a plan by its Stripe Price ID
 */
export function getPlanByStripePriceId(stripePriceId: string): TBILLING_PLAN | null {
  for (const plan of BILLING_PLANS) {
    if (
      plan.pricing.monthly.stripeId === stripePriceId ||
      plan.pricing.yearly.stripeId === stripePriceId
    ) {
      return plan;
    }
  }
  return null;
}

/**
 * Check if a plan has a trial period
 */
export function planHasTrial(planId: PlanId): boolean {
  const plan = getPlan(planId);
  return plan.trialDays !== null && plan.trialDays > 0;
}

/**
 * Get all plans as array
 */
export function getAllPlans(): TBILLING_PLAN[] {
  return BILLING_PLANS;
}

/**
 * Get only paid plans (with Stripe integration)
 */
export function getPaidPlans(): TBILLING_PLAN[] {
  return BILLING_PLANS.filter(
    (plan) => plan.pricing.monthly.stripeId !== null
  );
}
