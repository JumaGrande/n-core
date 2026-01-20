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
