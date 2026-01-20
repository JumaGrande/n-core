# Custom Instance - Documentación de Personalizaciones

Este documento detalla las personalizaciones realizadas sobre la plantilla AIStarterKit.

---

## Auth.js v5 (NextAuth) - Integración

### Descripción

Sistema de autenticación implementado con Auth.js v5 (anteriormente NextAuth.js) utilizando:
- **OAuth Provider**: Google
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Estrategia de sesión**: JWT (compatible con Edge Runtime)

### Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Google OAuth  │────▶│    Auth.js v5   │────▶│   PostgreSQL    │
│    Provider     │     │  (JWT Strategy) │     │   (Supabase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Middleware    │
                        │ (Edge Runtime)  │
                        └─────────────────┘
```

### Paso a paso de la integración

#### 1. Instalar dependencias

```bash
npm install next-auth@beta
npm install drizzle-orm @auth/drizzle-adapter postgres
npm install drizzle-kit --save-dev
```

#### 2. Configurar variables de entorno

Añadir en `.env`:

```env
# Auth.js
AUTH_SECRET=<generado con: openssl rand -base64 32>

# Google OAuth (https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database
```

#### 3. Crear el schema de base de datos

#### 4. Crear archivo de configuración de Drizzle

#### 5. Crear conexión a base de datos

#### 6. Crear configuración de Auth.js

#### 7. Crear API Route Handler

#### 8. Crear Middleware para protección de rutas

#### 9. Crear AuthProvider para componentes cliente

#### 10. Añadir AuthProvider al layout

#### 11. Ejecutar migraciones

```bash
npm run db:push    # Push directo del schema (desarrollo)
# o
npm run db:generate  # Generar archivos de migración
npm run db:migrate   # Aplicar migraciones
```

---

### Archivos creados/modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/auth.ts` | Nuevo | Configuración principal de Auth.js v5 |
| `src/app/api/auth/[...nextauth]/route.ts` | Nuevo | API route handler para Auth.js |
| `src/middleware.ts` | Nuevo | Middleware para proteger rutas |
| `src/app/providers/auth-provider.tsx` | Nuevo | SessionProvider wrapper para cliente |
| `src/db/schema.ts` | Nuevo | Schema de Drizzle con tablas de Auth.js |
| `src/db/index.ts` | Nuevo | Conexión a PostgreSQL con Drizzle |
| `drizzle.config.ts` | Nuevo | Configuración de Drizzle Kit |
| `src/app/layout.tsx` | Modificado | Añadido AuthProvider |
| `src/app/(site)/(auth)/_components/social-auth.tsx` | Modificado | Conectado botones con signIn() |
| `.env` | Modificado | Añadidas variables AUTH_SECRET, GOOGLE_* |

---

### Detalle de cada archivo

#### `src/lib/auth.ts`

**Función**: Configuración central de Auth.js v5.

**Exports**:
- `handlers` - GET/POST handlers para API routes
- `auth` - Función para obtener sesión en Server Components
- `signIn` - Función para iniciar sesión
- `signOut` - Función para cerrar sesión

**Configuración clave**:
- `adapter: DrizzleAdapter(db)` - Persistencia en PostgreSQL
- `session: { strategy: "jwt" }` - Sesiones JWT (Edge compatible)
- `callbacks.jwt` - Añade ID de usuario al token
- `callbacks.session` - Añade ID de usuario a la sesión

---

#### `src/app/api/auth/[...nextauth]/route.ts`

**Función**: Expone los endpoints de Auth.js.

**Endpoints generados**:
- `GET /api/auth/signin` - Página de login
- `GET /api/auth/signout` - Cerrar sesión
- `GET /api/auth/session` - Obtener sesión actual
- `GET /api/auth/providers` - Listar providers
- `POST /api/auth/callback/*` - Callbacks de OAuth

---

#### `src/middleware.ts`

**Función**: Proteger rutas que requieren autenticación.

**Rutas protegidas**:
- `/dashboard/*`
- `/settings/*`

**Comportamiento**: Redirige a `/signin` si el usuario no está autenticado.

---

#### `src/app/providers/auth-provider.tsx`

**Función**: Wrapper del SessionProvider de Auth.js para componentes cliente.

**Uso**: Permite usar el hook `useSession()` en Client Components.

---

#### `src/db/schema.ts`

**Función**: Define el schema de base de datos para Auth.js con Drizzle ORM.

**Tablas**:

| Tabla | Descripción | ¿Usada con JWT? |
|-------|-------------|-----------------|
| `users` | Datos del usuario (id, name, email, image) | ✅ Sí |
| `accounts` | Cuentas OAuth vinculadas | ✅ Sí |
| `sessions` | Sesiones de base de datos | ❌ No (usamos JWT) |
| `verification_tokens` | Tokens de verificación email | ✅ Sí |
| `authenticators` | Credenciales WebAuthn/Passkey | ✅ Sí |

---

#### `src/db/index.ts`

**Función**: Crea y exporta la conexión a PostgreSQL.

**Driver**: `postgres` (postgres.js) - Compatible con Next.js y Serverless.

**Nota**: Se usa `{ prepare: false }` para compatibilidad con Supabase pooler.

---

#### `drizzle.config.ts`

**Función**: Configuración de Drizzle Kit para migraciones.

**Comandos disponibles**:
```bash
npm run db:push      # Push schema directo (desarrollo)
npm run db:generate  # Generar archivos de migración
npm run db:migrate   # Aplicar migraciones
```

---

### Uso en la aplicación

#### Server Components

```typescript
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  return <div>Hola {session.user?.name}</div>
}
```

#### Client Components

```typescript
"use client"
import { useSession, signIn, signOut } from "next-auth/react"

export function UserButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <button onClick={() => signOut()}>
        Cerrar sesión ({session.user?.email})
      </button>
    )
  }

  return <button onClick={() => signIn("google")}>Iniciar sesión</button>
}
```

---

### Notas importantes

#### ¿Por qué JWT en lugar de Database Sessions?

El **middleware de Next.js** se ejecuta en **Edge Runtime**, que no puede hacer conexiones TCP a bases de datos. Con JWT:
- La sesión se almacena en una cookie firmada
- El middleware verifica la firma localmente (sin consultar BD)
- Los usuarios se persisten en BD, pero las sesiones no

#### ¿Por qué postgres.js en lugar de pg?

El driver `pg` (node-postgres) usa APIs nativas de Node.js que no son compatibles con el bundler de Next.js (Webpack). `postgres` (postgres.js) es un driver moderno compatible con todos los entornos.

---

### Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `cloudflare:sockets` | Driver `pg` incompatible | Usar `postgres` (postgres.js) |
| `ECONNREFUSED` | BD no accesible o URL incorrecta | Verificar DATABASE_URL |
| `AdapterError` en middleware | Database sessions + Edge | Usar `session: { strategy: "jwt" }` |
| `AUTH_SECRET` missing | Variable no configurada | Generar con `openssl rand -base64 32` |

---

## Stripe - Integración de Suscripciones

### Descripción

Sistema de suscripciones implementado con Stripe para gestionar planes de pago con:
- **Checkout Sessions**: Flujo de pago seguro
- **Customer Portal**: Gestión de suscripción por el usuario
- **Webhooks**: Sincronización de eventos en tiempo real
- **Trial Periods**: Períodos de prueba configurables por plan

### Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Pricing UI    │────▶│  Checkout API   │────▶│     Stripe      │
│  (Client-side)  │     │   /api/stripe   │     │   Dashboard     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        │
                        ┌─────────────────┐            │
                        │   PostgreSQL    │◀───────────┘
                        │ user_subscript. │   (Webhooks)
                        └─────────────────┘
```

### Flujo de suscripción

```
1. Usuario selecciona plan → POST /api/stripe/checkout
2. Stripe redirige a Checkout → Usuario paga
3. Stripe redirige a success_url → GET /api/stripe/checkout?session_id=xxx
4. Se actualiza la BD con la suscripción
5. Webhook confirma → POST /api/stripe/webhook
```

---

### Variables de entorno necesarias

```env
# =============================================================================
# STRIPE CONFIGURATION
# =============================================================================

# Secret key (server-side only, nunca exponer al cliente)
# Obtener de: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxx

# Publishable key (seguro para exponer al cliente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxx

# Webhook secret para verificar firmas
# Obtener de: https://dashboard.stripe.com/webhooks
# O usar `stripe listen --forward-to localhost:3000/api/stripe/webhook`
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------------
# STRIPE PRICE IDS (generados por stripe-seed.ts o manualmente en Dashboard)
# -----------------------------------------------------------------------------
# NOTA: Solo se usan las variables NEXT_PUBLIC_* ya que pricing/data.ts
# se comparte entre cliente y servidor.

# Plus Plan (NEXT_PUBLIC_* son las activas)
UNUSED_STRIPE_PLUS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx  # Backup/referencia
UNUSED_STRIPE_PLUS_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx   # Backup/referencia
NEXT_PUBLIC_STRIPE_PLUS_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PLUS_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx

# Pro Plan (NEXT_PUBLIC_* son las activas)
UNUSED_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx   # Backup/referencia
UNUSED_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx    # Backup/referencia
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
```

---

### Tabla de base de datos: `user_subscriptions`

```sql
CREATE TABLE "user_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE,           -- FK a users.id
  "stripe_customer_id" text UNIQUE,         -- cus_xxx
  "stripe_subscription_id" text UNIQUE,     -- sub_xxx
  "stripe_price_id" text,                   -- price_xxx
  "plan_id" text NOT NULL DEFAULT 'free',   -- 'free' | 'plus' | 'pro'
  "status" text NOT NULL DEFAULT 'inactive', -- Estado de Stripe
  "trial_started_at" timestamp,
  "trial_ends_at" timestamp,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "canceled_at" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),

  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
```

**Estados posibles (`status`):**
| Estado | Descripción |
|--------|-------------|
| `inactive` | Sin suscripción activa |
| `trialing` | En período de prueba |
| `active` | Suscripción activa y pagando |
| `past_due` | Pago fallido, pendiente de reintento |
| `canceled` | Suscripción cancelada |
| `unpaid` | Múltiples pagos fallidos |

---

### Archivos creados/modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/components/sections/pricing/data.ts` | Modificado | Definición maestra de planes (UI + Stripe) |
| `src/lib/stripe.ts` | Nuevo | Cliente Stripe y funciones de gestión |
| `src/app/api/stripe/checkout/route.ts` | Nuevo | Crear y procesar checkout |
| `src/app/api/stripe/portal/route.ts` | Nuevo | Abrir Customer Portal |
| `src/app/api/stripe/webhook/route.ts` | Nuevo | Recibir eventos de Stripe |
| `src/db/schema.ts` | Modificado | Añadida tabla `userSubscriptions` |
| `scripts/stripe-seed.ts` | Nuevo | Script para crear productos en Stripe |
| `src/app/(dashboard)/dashboard/settings/actions.ts` | Modificado | Server actions para suscripción |
| `src/app/(dashboard)/dashboard/settings/settings-forms.tsx` | Modificado | UI de gestión de suscripción |
| `src/components/sections/pricing/card.tsx` | Modificado | Conectado checkout |

---

### Detalle de cada archivo

#### `src/components/sections/pricing/data.ts`

**Función**: Fichero único que define todos los planes de suscripción. Usado tanto por la UI de pricing como por la integración de Stripe.

**Types exportados**:
```typescript
type PlanType = 'free' | 'plus' | 'pro' | 'enterprise';
type PlanId = 'free' | 'plus' | 'pro'; // Solo planes con Stripe
type PlanInterval = 'monthly' | 'yearly';

interface TBILLING_PLAN {
  id: PlanType;
  name: string;
  description: string;
  pricing: {
    monthly: { amount: number; formattedPrice: string; stripeId: string | null };
    yearly: { amount: number; formattedPrice: string; stripeId: string | null };
  };
  features: string[];
  limits: { tokens: number; projects: number }; // -1 = ilimitado
  cta: string;
  popular: boolean;
  trialDays: number | null;
}
```

**Funciones exportadas**:
| Función | Descripción |
|---------|-------------|
| `getPlan(planId)` | Obtiene un plan por ID |
| `getPlanByStripePriceId(priceId)` | Obtiene plan por Stripe Price ID |
| `planHasTrial(planId)` | Verifica si el plan tiene trial |
| `getAllPlans()` | Devuelve todos los planes como array |
| `getPaidPlans()` | Devuelve solo los planes de pago (con Stripe) |

**Planes definidos**:
| Plan | Precio/mes | Trial | Tokens/mes | Proyectos |
|------|------------|-------|------------|-----------|
| Free | $0 | - | 25,000 | 3 |
| Plus | $15 ($12 anual) | 14 días | 250,000 | Ilimitados |
| Pro | $40 ($32 anual) | 7 días | 1,000,000 | Ilimitados |
| Enterprise | Contacto | - | Ilimitados | Ilimitados |

> **Nota**: Enterprise no tiene integración con Stripe (requiere contacto de ventas).

---

#### `src/lib/stripe.ts`

**Función**: Cliente de Stripe y funciones de gestión de suscripciones.

**Exports principales**:

| Export | Tipo | Descripción |
|--------|------|-------------|
| `stripe` | Stripe | Cliente de Stripe inicializado |
| `getOrCreateStripeCustomer()` | Function | Obtiene o crea cliente en Stripe |
| `createCheckoutSession()` | Function | Crea sesión de checkout |
| `createCustomerPortalSession()` | Function | Crea sesión del portal |
| `getUserSubscription()` | Function | Obtiene suscripción del usuario |
| `getSubscriptionByCustomerId()` | Function | Busca suscripción por customer ID |
| `updateSubscription()` | Function | Actualiza suscripción en BD |
| `hasActiveSubscription()` | Function | Verifica si tiene suscripción activa |
| `isInTrial()` | Function | Verifica si está en trial |
| `getCurrentPlan()` | Function | Obtiene el plan actual |
| `canAccessFeature()` | Function | Verifica acceso a feature por plan |

**`createCheckoutSession` - Parámetros**:
```typescript
{
  userId: string;
  email: string;
  name?: string;
  priceId: string;     // Stripe Price ID
  successUrl: string;  // URL post-pago exitoso
  cancelUrl: string;   // URL si cancela
}
```

**`createCustomerPortalSession`**:
- Crea configuración programática del portal si no existe
- Permite: cambiar plan, cancelar, actualizar pago, ver facturas
- Cancelación configurada como "al final del período"

---

#### `src/app/api/stripe/checkout/route.ts`

**Función**: API route para crear y procesar sesiones de checkout.

**Endpoints**:

| Método | Descripción |
|--------|-------------|
| `POST` | Crea nueva sesión de checkout |
| `GET` | Procesa retorno exitoso de Stripe |

**POST Request**:
```typescript
// Body
{ priceId: "price_xxx" }

// Response
{ url: "https://checkout.stripe.com/..." }
```

**GET Flow**:
1. Recibe `?session_id=cs_xxx` de Stripe
2. Recupera sesión y suscripción de Stripe API
3. Actualiza `user_subscriptions` en BD
4. Redirige a `/dashboard?checkout=success`

---

#### `src/app/api/stripe/portal/route.ts`

**Función**: API route para abrir el Customer Portal de Stripe.

**POST Response**:
```typescript
{ url: "https://billing.stripe.com/..." }
// o
{ error: "mensaje", redirectTo: "/pricing" }
```

---

#### `src/app/api/stripe/webhook/route.ts`

**Función**: Recibe y procesa webhooks de Stripe.

**Eventos manejados**:

| Evento | Acción |
|--------|--------|
| `checkout.session.completed` | Log (suscripción manejada por subscription.created) |
| `customer.subscription.created` | Crear/actualizar registro de suscripción |
| `customer.subscription.updated` | Actualizar estado, fechas, cancelación |
| `customer.subscription.deleted` | Resetear a plan free |
| `invoice.payment_failed` | Marcar como `past_due` |

**Verificación de firma**:
```typescript
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

---

#### `scripts/stripe-seed.ts`

**Función**: Script para crear productos y precios de prueba en Stripe.

**Ejecutar**:
```bash
npx tsx scripts/stripe-seed.ts
```

**Qué hace**:
1. Crea producto "Plus" con precios monthly ($15) y yearly ($144)
2. Crea producto "Pro" con precios monthly ($40) y yearly ($384)
3. Actualiza automáticamente las variables en `.env`

**Requisitos**:
- `STRIPE_SECRET_KEY` debe empezar con `sk_test_` (modo test)
- Solo ejecutar una vez (crea productos duplicados si se repite)

---

#### `src/app/(dashboard)/dashboard/settings/actions.ts`

**Server Actions relacionadas con Stripe**:

| Action | Descripción |
|--------|-------------|
| `customerPortalAction()` | Abre el portal de Stripe |
| `getSubscriptionStatus()` | Obtiene estado de suscripción para UI |

**`getSubscriptionStatus()` Response**:
```typescript
{
  planId: 'plus',
  planName: 'Plus',
  status: 'trialing',
  trialEndsAt: Date | null,
  currentPeriodEnd: Date | null,
  cancelAtPeriodEnd: boolean
}
```

---

### Uso en la aplicación

#### Verificar suscripción en Server Component

```typescript
import { hasActiveSubscription, getCurrentPlan, canAccessFeature } from '@/lib/stripe';

export default async function ProtectedPage() {
  const session = await auth();

  // Verificar suscripción activa
  const isActive = await hasActiveSubscription(session.user.id);

  // Obtener plan actual
  const plan = await getCurrentPlan(session.user.id);

  // Verificar acceso a feature
  const canAccessPro = await canAccessFeature(session.user.id, 'pro');

  if (!canAccessPro) {
    redirect('/pricing');
  }

  return <div>Contenido premium</div>;
}
```

#### Iniciar checkout desde Client Component

```typescript
'use client';

async function handleSubscribe(priceId: string) {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  });

  const { url, error } = await response.json();

  if (url) {
    window.location.href = url;
  }
}
```

#### Abrir Customer Portal

```typescript
'use client';
import { customerPortalAction } from './actions';

async function handleManageSubscription() {
  const result = await customerPortalAction();

  if (result.url) {
    window.location.href = result.url;
  } else if (result.redirectTo) {
    router.push(result.redirectTo);
  }
}
```

---

### Configuración de Webhooks

#### Desarrollo local

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copiar el webhook secret que muestra (whsec_xxx) a .env
```

#### Producción

1. Ir a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Añadir endpoint: `https://tudominio.com/api/stripe/webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copiar "Signing secret" a `STRIPE_WEBHOOK_SECRET`

---

### Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `No such price` | Price ID incorrecto o no existe | Ejecutar `stripe-seed.ts` o verificar en Dashboard |
| `Webhook signature verification failed` | `STRIPE_WEBHOOK_SECRET` incorrecto | Usar el secret del CLI o Dashboard |
| `No Stripe customer found` | Usuario sin `stripeCustomerId` | Se crea automáticamente en checkout |
| `current_period_start` undefined | Stripe API v20+ | Usar type assertion `(subscription as any).current_period_start` |
| Suscripción no se actualiza | Webhook no configurado | Verificar `stripe listen` está corriendo |

---

### Notas importantes

#### Modo Test vs Producción

- **Test keys** (`sk_test_`, `pk_test_`): Para desarrollo, pagos simulados
- **Live keys** (`sk_live_`, `pk_live_`): Para producción, pagos reales
- El script `stripe-seed.ts` solo funciona con test keys

#### Customer Portal programático

La configuración del portal se crea automáticamente la primera vez que se llama a `createCustomerPortalSession()`. Incluye:
- Cambiar de plan (con prorrateo)
- Cancelar suscripción (al final del período)
- Actualizar método de pago
- Ver historial de facturas

#### Cancelación de suscripción

Cuando un usuario cancela desde el portal:
1. `cancel_at_period_end` se pone a `true`
2. La suscripción sigue `active` hasta `current_period_end`
3. Al expirar, Stripe envía `customer.subscription.deleted`
4. El webhook resetea el usuario a plan `free`
