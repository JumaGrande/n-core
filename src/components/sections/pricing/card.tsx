'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon } from '@/icons/icons';
import GlowGradient from '@/assets/pricing/glow';
import type { TBILLING_PLAN } from '@/components/sections/pricing/data';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PropsWithChildren } from 'react';

type Props = {
  plan: TBILLING_PLAN;
  billingPeriod: keyof TBILLING_PLAN['pricing'];
};

export function PricingCard({ plan, billingPeriod }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    const stripeId = plan.pricing[billingPeriod].stripeId;

    // Plan Free - redirigir a signup
    if (plan.id === 'free') {
      router.push('/signup');
      return;
    }

    // Plan de pago sin stripeId configurado
    if (!stripeId) {
      console.error('Stripe Price ID not configured for this plan');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: stripeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si no está autenticado, redirigir a login
        if (response.status === 401) {
          router.push(`/signin?redirect=/pricing&priceId=${stripeId}`);
          return;
        }
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`bg-white dark:bg-dark-primary rounded-[20px] shadow-one relative z-10 h-full ${
          plan.popular ? 'relative border-2 border-primary-500' : ''
        }`}
      >
        <div className="p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-400">
              {plan.name}
            </h2>
            {plan.popular && (
              <span className="px-2 py-1 text-xs font-medium dark:text-pir rounded-full dark:bg-primary-500/15 bg-primary-50 text-primary-500">
                Popular
              </span>
            )}
          </div>
          <p className="flex items-baseline mt-4">
            <span className="text-4xl font-semibold text-gray-800 dark:text-white/90">
              {plan.pricing[billingPeriod].formattedPrice}
            </span>

            {!!plan.pricing[billingPeriod].amount && (
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                {billingPeriod === 'yearly' ? 'Per year' : 'Per month'}
              </span>
            )}
          </p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {plan.description}
          </p>

          {plan.trialDays && (
            <p className="mt-2 text-xs text-primary-500 font-medium">
              {plan.trialDays} days free trial
            </p>
          )}

          {plan.id === 'enterprise' ? (
            <ContactSalesLink>{plan.cta}</ContactSalesLink>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={cn(
                'block w-full px-8 py-3.5 mt-7 text-sm font-medium text-center rounded-full transition',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                {
                  'dark:bg-dark-primary dark:text-white/90 dark:hover:bg-gray-800 dark:border-gray-800 text-gray-800 bg-white border border-gray-200 hover:bg-gray-50':
                    plan.id === 'free',
                  'gradient-btn text-white': plan.popular,
                  'dark:hover:bg-primary-500 dark:bg-white/[0.03] hover:bg-gray-900 text-white bg-gray-700':
                    !plan.popular && plan.id !== 'free',
                }
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                plan.cta
              )}
            </button>
          )}
        </div>
        <div className="px-8 pb-7">
          <ul className="space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  <CheckIcon />
                </div>

                <p className="ml-2 text-sm text-gray-800 dark:text-white/90">
                  {feature}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {plan.popular && (
        <GlowGradient className="absolute -left-full -translate-x-20 top-0 max-lg:hidden" />
      )}
    </div>
  );
}

function ContactSalesLink({ children }: PropsWithChildren) {
  return (
    <Link
      href="/contact"
      className="block w-full px-8 py-3.5 mt-7 text-sm font-medium text-center rounded-full transition dark:hover:bg-primary-500 dark:bg-white/[0.03] hover:bg-gray-900 text-white bg-gray-700"
    >
      {children}
    </Link>
  );
}
