/**
 * Stripe Seed Script
 *
 * Crea los productos y precios de prueba en Stripe y actualiza el .env
 *
 * Ejecutar con: npx tsx scripts/stripe-seed.ts
 */

import Stripe from 'stripe';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

interface PriceIds {
  plusMonthly: string;
  plusYearly: string;
  proMonthly: string;
  proYearly: string;
}

async function createStripeProducts(): Promise<PriceIds> {
  console.log('🚀 Creating Stripe products and prices...\n');

  // ============================================
  // PLUS PLAN - $15/mes, $144/año (14 días trial)
  // ============================================
  console.log('Creating Plus plan...');

  const plusProduct = await stripe.products.create({
    name: 'Plus',
    description: 'Para profesionales - 100 generaciones al mes, soporte prioritario',
    metadata: {
      planId: 'plus',
    },
  });
  console.log(`  ✓ Product created: ${plusProduct.id}`);

  const plusMonthlyPrice = await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 1500, // $15 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 14,
    },
    metadata: {
      planId: 'plus',
      interval: 'monthly',
    },
  });
  console.log(`  ✓ Monthly price: ${plusMonthlyPrice.id} ($15/month)`);

  const plusYearlyPrice = await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 14400, // $144 in cents ($12/month)
    currency: 'usd',
    recurring: {
      interval: 'year',
      trial_period_days: 14,
    },
    metadata: {
      planId: 'plus',
      interval: 'yearly',
    },
  });
  console.log(`  ✓ Yearly price: ${plusYearlyPrice.id} ($144/year)\n`);

  // ============================================
  // PRO PLAN - $40/mes, $384/año (7 días trial)
  // ============================================
  console.log('Creating Pro plan...');

  const proProduct = await stripe.products.create({
    name: 'Pro',
    description: 'Para equipos - Generaciones ilimitadas, soporte 24/7, API access',
    metadata: {
      planId: 'pro',
    },
  });
  console.log(`  ✓ Product created: ${proProduct.id}`);

  const proMonthlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4000, // $40 in cents
    currency: 'usd',
    recurring: {
      interval: 'month',
      trial_period_days: 7,
    },
    metadata: {
      planId: 'pro',
      interval: 'monthly',
    },
  });
  console.log(`  ✓ Monthly price: ${proMonthlyPrice.id} ($40/month)`);

  const proYearlyPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 38400, // $384 in cents ($32/month)
    currency: 'usd',
    recurring: {
      interval: 'year',
      trial_period_days: 7,
    },
    metadata: {
      planId: 'pro',
      interval: 'yearly',
    },
  });
  console.log(`  ✓ Yearly price: ${proYearlyPrice.id} ($384/year)\n`);

  return {
    plusMonthly: plusMonthlyPrice.id,
    plusYearly: plusYearlyPrice.id,
    proMonthly: proMonthlyPrice.id,
    proYearly: proYearlyPrice.id,
  };
}

async function updateEnvFile(priceIds: PriceIds) {
  console.log('📝 Updating .env file...\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = await fs.readFile(envPath, 'utf-8');

  // Reemplazar los Price IDs (solo NEXT_PUBLIC_* son usados activamente)
  const replacements: [RegExp, string][] = [
    [/UNUSED_STRIPE_PLUS_MONTHLY_PRICE_ID=.*/g, `UNUSED_STRIPE_PLUS_MONTHLY_PRICE_ID=${priceIds.plusMonthly}`],
    [/UNUSED_STRIPE_PLUS_YEARLY_PRICE_ID=.*/g, `UNUSED_STRIPE_PLUS_YEARLY_PRICE_ID=${priceIds.plusYearly}`],
    [/UNUSED_STRIPE_PRO_MONTHLY_PRICE_ID=.*/g, `UNUSED_STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.proMonthly}`],
    [/UNUSED_STRIPE_PRO_YEARLY_PRICE_ID=.*/g, `UNUSED_STRIPE_PRO_YEARLY_PRICE_ID=${priceIds.proYearly}`],
    [/NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=.*/g, `NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=${priceIds.plusMonthly}`],
    [/NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=.*/g, `NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=${priceIds.plusYearly}`],
    [/NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=.*/g, `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.proMonthly}`],
    [/NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=.*/g, `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=${priceIds.proYearly}`],
  ];

  for (const [pattern, replacement] of replacements) {
    envContent = envContent.replace(pattern, replacement);
  }

  await fs.writeFile(envPath, envContent);

  console.log('  ✓ NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID updated');
  console.log('  ✓ NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID updated');
  console.log('  ✓ NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID updated');
  console.log('  ✓ NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID updated');
  console.log('  ✓ UNUSED_* variables updated (for reference)\n');
}

async function main() {
  console.log('\n========================================');
  console.log('       STRIPE SEED SCRIPT');
  console.log('========================================\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY not found in environment');
    console.log('Make sure you have set STRIPE_SECRET_KEY in your .env file');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.error('❌ Error: This script should only be run with TEST keys');
    console.log('Your STRIPE_SECRET_KEY should start with "sk_test_"');
    process.exit(1);
  }

  try {
    const priceIds = await createStripeProducts();
    await updateEnvFile(priceIds);

    console.log('========================================');
    console.log('✅ Stripe seed completed successfully!');
    console.log('========================================\n');
    console.log('Price IDs created:');
    console.log(`  Plus Monthly: ${priceIds.plusMonthly}`);
    console.log(`  Plus Yearly:  ${priceIds.plusYearly}`);
    console.log(`  Pro Monthly:  ${priceIds.proMonthly}`);
    console.log(`  Pro Yearly:   ${priceIds.proYearly}`);
    console.log('\n🎉 You can now run the app and test subscriptions!\n');

  } catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  }
}

main();
