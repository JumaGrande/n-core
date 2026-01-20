import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCustomerPortalSession } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    const portalSession = await createCustomerPortalSession(
      session.user.id,
      `${APP_URL}/dashboard/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);

    // Si el usuario no tiene suscripción, redirigir a pricing
    if (error instanceof Error && error.message.includes('No Stripe customer')) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa', redirectTo: '/pricing' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al abrir el portal de gestión' },
      { status: 500 }
    );
  }
}
