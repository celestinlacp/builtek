# Onboarding, Trial y Admin — Spec de Forge

**Proyecto:** Builtek
**Fecha:** 2026-10-25
**Branch:** forge/20261025-onboarding-trial-admin

---

## Objetivo

Implementar el flujo completo de onboarding con trial de 14 días (plan Obra), el modo read-only al vencer el trial, secuencia de emails de conversión, panel admin para cambio de plan, impersonation desde super-admin, panel de trials activos, y links de invitación personalizada con trial extendido de 30 días + 2 sesiones de personalización incluidas.

---

## Decisiones fijas (no cambiar)

- Plan Free eliminado — ya no existe
- Trial siempre = plan Obra completo, 14 días, para TODOS los registros nuevos
- Al vencer sin plan pagado → Opción B: read-only (ven todo, no pueden crear/editar/subir)
- Partner = servicio de desarrollo a la medida, separado del plan Pro (no es un tier de pricing)
- Nombre del fundador para comunicaciones: **Luis Celestin**

---

## Inconsistencias detectadas en el codebase

1. `package.json` declara `"next": "16.2.12"` — versión no estándar. Verificar con `npx next --version` antes de implementar. Leer `node_modules/next/dist/docs/` como indica `AGENTS.md`.
2. `package.json` incluye `@anthropic-ai/sdk` pero `MASTER_PROMPT.md` menciona Gemini. Este spec no toca el módulo AI — no instalar ni usar ningún SDK de AI.

---

## FEATURE 1 — CTAs del pricing (`PricingSection.tsx`)

Modificar únicamente los CTAs y variantes de botón de cuatro planes. No tocar copy ni estructura.

| Plan | CTA label | href | ctaVariant |
|------|-----------|------|------------|
| Starter | "Empezar gratis 14 días" | `/register?plan=starter` | `outline` |
| Obra | "Empezar gratis 14 días" | `/register?plan=obra` | `primary` |
| Pro | "Agendar llamada" | `https://wa.me/521XXXXXXXXXX?text=Hola, me interesa el plan Pro de Builtek` | `outline` |
| Contractor | "Solicitar propuesta" | `/demo` | `outline` |

El número de WhatsApp es placeholder. Buscar variable `NEXT_PUBLIC_WHATSAPP_SUPPORT` en el proyecto; si no existe, dejar placeholder con comentario `// TODO: reemplazar con número real`.

**Criterios de aceptación:**
- [ ] CTA Starter navega a `/register?plan=starter`
- [ ] CTA Obra navega a `/register?plan=obra`
- [ ] CTA Pro abre WhatsApp en nueva pestaña con texto predefinido
- [ ] CTA Contractor navega a `/demo`
- [ ] Card Obra mantiene `featured: true`
- [ ] No se modificó el copy de ningún plan

---

## FEATURE 2 — Backend trial + read-only mode

### 2a. Migración SQL

```sql
-- supabase/migrations/001_trial_columns.sql
ALTER TABLE workspaces
  ADD COLUMN trial_ends_at    TIMESTAMPTZ,
  ADD COLUMN trial_plan       TEXT,
  ADD COLUMN intended_plan    TEXT,
  ADD COLUMN status           TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trial_expired', 'suspended')),
  ADD COLUMN email_day10_sent TIMESTAMPTZ,
  ADD COLUMN email_day13_sent TIMESTAMPTZ,
  ADD COLUMN email_day14_sent TIMESTAMPTZ,
  ADD COLUMN email_day21_sent TIMESTAMPTZ;

CREATE INDEX idx_workspaces_trial_ends_at
  ON workspaces (trial_ends_at)
  WHERE status = 'active';
```

### 2b. Flujo de registro (`/register`)

Al completar el formulario:
1. `supabase.auth.signUp` con email + password
2. Insertar en tabla `users`: `{ id, email, full_name }`
3. Crear workspace con:
   - `plan = 'obra'`
   - `trial_ends_at = now() + INTERVAL '14 days'`
   - `trial_plan = 'obra'`
   - `intended_plan = <query param ?plan>` (null si no hay)
   - `status = 'active'`
4. Insertar en `workspace_members`: `{ workspace_id, user_id, role: 'owner' }`
5. Si hay `?invite=<token>`: ver Feature 7 — `trial_days` viene del invite
6. Redirigir a `/dashboard`

Formulario captura: nombre completo, email, contraseña, nombre de la empresa (genera slug del workspace).

### 2c. Cron de expiración

`src/app/api/cron/expire-trials/route.ts`

- Método: `GET`
- Header requerido: `Authorization: Bearer <CRON_SECRET>`
- Lógica:
  ```sql
  UPDATE workspaces
  SET status = 'trial_expired'
  WHERE trial_ends_at < now()
    AND status = 'active'
    AND plan = 'obra'
  ```
- También evalúa y envía emails (ver Feature 3)
- Responde `{ updated: N, emails_sent: [...] }`

### 2d. Hook `useWorkspacePlan`

`src/hooks/useWorkspacePlan.ts`

```typescript
{
  plan: string              // 'obra' | 'starter' | 'pro' | 'contractor'
  status: string            // 'active' | 'trial_expired' | 'suspended'
  trialEndsAt: Date | null
  daysLeft: number | null
  isTrialExpired: boolean
  isTrial: boolean
  intendedPlan: string | null
}
```

### 2e. Banner de trial expirado

En `src/app/(dashboard)/layout.tsx`, cuando `isTrialExpired === true`:

- Banner sticky en la parte superior, no dismissable
- Fondo `amber-50`, borde `amber-200`, texto `amber-900`
- Texto: "Tu período de prueba venció — elige un plan para continuar creando."
- Botón: "Ver planes" → `/pricing`

### 2f. Modal de acción bloqueada

`src/components/TrialExpiredModal.tsx`

Se dispara cuando usuario en `trial_expired` intenta: crear tarea, subir documento, invitar usuario, crear proyecto.

- Título: "Esta función requiere un plan activo"
- Texto: "Tu período de prueba ha vencido. Tus datos están seguros — activa un plan para continuar."
- Botón primario: "Ver planes" → `/pricing`
- Botón secundario: "Cancelar"

**Criterios de aceptación Feature 2:**
- [ ] Workspace creado con `plan='obra'`, `trial_ends_at=now()+14d`, `status='active'` al registrarse
- [ ] `intended_plan` guarda el valor del query param `?plan`
- [ ] Cron requiere `CRON_SECRET` y actualiza workspaces expirados
- [ ] Hook retorna `isTrialExpired=true` cuando `status='trial_expired'`
- [ ] Banner sticky aparece en todas las páginas del dashboard cuando `isTrialExpired=true`
- [ ] Las 4 acciones de escritura muestran el modal cuando `isTrialExpired=true`
- [ ] "Ver planes" del banner y del modal navegan a `/pricing`

---

## FEATURE 3 — Secuencia de emails (Resend)

Cuatro emails transaccionales evaluados en el cron diario:

| Día | Condición | Asunto |
|-----|-----------|--------|
| 10 | `trial_ends_at - 4 days <= now()` AND `email_day10_sent IS NULL` | "Te quedan 4 días en Builtek" |
| 13 | `trial_ends_at - 1 day <= now()` AND `email_day13_sent IS NULL` | "Mañana vence tu prueba" |
| 14 | `trial_ends_at <= now()` AND `email_day14_sent IS NULL` | "Tu prueba venció — tus datos están seguros" |
| 21 | `trial_ends_at + 7 days <= now()` AND `email_day21_sent IS NULL` | "¿Seguiste adelante con tu proyecto?" |

Templates en `src/lib/emails/`. Al enviar con éxito, marcar el flag correspondiente en `workspaces`. Si Resend falla, no marcar el flag (reintentará el día siguiente).

**Criterios de aceptación Feature 3:**
- [ ] Cada email se envía exactamente una vez por workspace (flag)
- [ ] Si Resend retorna error, el flag no se marca
- [ ] Los emails usan el nombre del owner (no solo el email)
- [ ] Los CTAs tienen URLs absolutas

---

## FEATURE 4 — Admin: cambiar plan del workspace

En `/admin`, sección "Tu plan" visible solo para el Owner:

- Muestra: plan actual, estado, días restantes si está en trial
- Botón "Cambiar plan" → modal con selector de plan: `starter | obra | pro | contractor`
- Campo "Notas internas" (solo visible en impersonation)
- Al confirmar: `PATCH /api/admin/workspace/plan`
- Si el workspace estaba en `trial_expired` y se asigna plan nuevo: `status` vuelve a `'active'`
- Registrar en `plan_change_log`

### Migración

```sql
-- supabase/migrations/002_plan_change_log.sql
CREATE TABLE plan_change_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) NOT NULL,
  changed_by    UUID REFERENCES users(id) NOT NULL,
  old_plan      TEXT NOT NULL,
  new_plan      TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

**Criterios de aceptación Feature 4:**
- [ ] Solo el Owner ve el botón "Cambiar plan"
- [ ] Modal muestra los 4 planes
- [ ] `workspaces.plan` se actualiza en Supabase
- [ ] Cambio registrado en `plan_change_log`
- [ ] Si venía de `trial_expired`, `status` vuelve a `active`
- [ ] UI muestra el nuevo plan sin reload

---

## FEATURE 5 — Super-admin: impersonation

Ruta `/super-admin` protegida: solo accesible si `session.user.email === process.env.SUPER_ADMIN_EMAIL`.

**Botón "Entrar como" por workspace:**

1. `POST /api/super-admin/impersonate` con `{ workspaceId }`
2. Crea cookie `__builtek_impersonation` firmada con HMAC-SHA256 usando `SUPER_ADMIN_SECRET`
   - Payload: `{ workspaceId, ownerId, originalUserId, expiresAt: now() + 2h }`
   - HttpOnly, Secure, SameSite=Lax
3. Redirige a `/dashboard` como el owner del workspace

**Banner de impersonation** (por encima del banner de trial):
- Fondo `red-900`, texto blanco
- Texto: "Estás viendo el workspace de [workspace.name]"
- Botón "Salir" → `POST /api/super-admin/impersonate/exit` → borra cookie → redirige a `/super-admin`

**Criterios de aceptación Feature 5:**
- [ ] Solo `SUPER_ADMIN_EMAIL` accede a `/super-admin`
- [ ] Middleware redirige a `/dashboard` si usuario normal intenta acceder
- [ ] "Entrar como" muestra el dashboard del cliente
- [ ] Banner rojo visible en todas las páginas del dashboard durante impersonation
- [ ] "Salir" regresa a `/super-admin` y elimina la cookie
- [ ] Cookie expira en 2 horas
- [ ] Usuario normal no puede forjar la cookie (requiere `SUPER_ADMIN_SECRET`)

---

## FEATURE 6 — Super-admin: panel de trials activos

Nueva sección en `/super-admin`, tab "Trials activos".

Query principal:

```sql
SELECT
  w.id, w.name,
  w.trial_ends_at,
  EXTRACT(DAY FROM (w.trial_ends_at - now())) AS days_left,
  u.email AS owner_email,
  u.full_name AS owner_name,
  u.last_seen_at,
  (SELECT COUNT(*) FROM projects p WHERE p.workspace_id = w.id) AS projects_count,
  (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.workspace_id = w.id) AS tasks_count,
  (SELECT COUNT(*) FROM documents d JOIN projects p ON d.project_id = p.id WHERE p.workspace_id = w.id) AS docs_count,
  (SELECT COUNT(*) FROM extractions e JOIN documents d ON e.document_id = d.id JOIN projects p ON d.project_id = p.id WHERE p.workspace_id = w.id) AS ai_extractions_count,
  (SELECT COUNT(*) FROM workspace_members wm WHERE wm.workspace_id = w.id) - 1 AS invited_users_count
FROM workspaces w
JOIN users u ON u.id = w.owner_id
WHERE w.trial_ends_at IS NOT NULL
  AND w.trial_ends_at > now() - INTERVAL '2 days'
ORDER BY days_left ASC;
```

Tabla: Empresa · Días restantes · Último acceso · Proyectos · Tareas · Docs · AI extracciones · Usuarios invitados · [Entrar como]

- Días negativos (expirados recientes) en rojo
- Último acceso en formato relativo ("hace 2 días")
- Cada fila tiene botón "Entrar como" (Feature 5)

Nota: agregar columna `last_seen_at TIMESTAMPTZ` a tabla `users` pública y actualizarla en middleware al hacer login.

**Criterios de aceptación Feature 6:**
- [ ] Tabla muestra todos los workspaces en trial
- [ ] Ordenado por días restantes ascendente
- [ ] Expirados recientes aparecen en rojo
- [ ] Conteos de proyectos, tareas, docs y AI son correctos
- [ ] "Usuarios invitados" excluye al owner
- [ ] Botón "Entrar como" activa impersonation

---

## FEATURE 7 — Links de invitación personalizada

### 7a. Migración SQL

```sql
-- supabase/migrations/003_invite_links.sql
CREATE TABLE invite_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token             TEXT UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  recipient_name    TEXT NOT NULL,
  recipient_company TEXT,
  trial_days        INTEGER NOT NULL DEFAULT 30,
  created_by        UUID REFERENCES users(id),
  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'used', 'expired')),
  opened_at         TIMESTAMPTZ,
  open_count        INTEGER DEFAULT 0,
  used_by_workspace UUID REFERENCES workspaces(id),
  used_at           TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ DEFAULT now() + INTERVAL '90 days',
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
-- Sin policy pública — acceso solo via service_role key desde endpoints de super-admin
```

### 7b. Página `/invitacion/[token]`

`src/app/invitacion/[token]/page.tsx` — pública, no requiere login, `noindex nofollow`.

Al cargar:
1. Leer `invite_links` por `token` via service_role key
2. Si no existe o `status='expired'`: "Este link ya no está disponible"
3. Si `status='used'`: "Esta invitación ya fue utilizada"
4. Si válida: incrementar `open_count`, guardar `opened_at` si es NULL

Contenido de la página:

```
[Header visual Builtek]

"[recipient_name], tienes una invitación exclusiva a Builtek"

"[recipient_company] · Acceso personal de Luis Celestin, fundador"

━━━ Lo que incluye esta invitación ━━━

✓ 30 días completos del plan Obra — sin tarjeta de crédito
  IA integrada, control documental, WhatsApp automático

✓ 2 sesiones de personalización incluidas
  Luis Celestin revisará contigo las necesidades específicas de
  [recipient_company] y adaptará la plataforma a cómo trabaja
  tu equipo. Lo que se desarrolle es tuyo, para siempre.

[Nota sutil debajo]: Las sesiones se coordinan personalmente
por Luis Celestin una semana después de tu registro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Botón primario]: "Crear mi cuenta →"  →  /register?invite=[token]
[Botón secundario]: [WhatsApp icon] "Hablar con Luis Celestin"  →  wa.me/521XXXXXXXXXX
```

Si `recipient_company` es null, omitir menciones de empresa.

### 7c. Email automático día 7 post-registro (para invitados)

Cuando el workspace tiene `invite_link` asociado y han pasado 7 días desde `created_at`:

Asunto: "Tus sesiones de personalización en Builtek, [nombre]"

```
Hola [recipient_name],

Ya llevas 7 días en Builtek — espero que hayas tenido oportunidad de explorar la plataforma.

Como parte de tu acceso exclusivo, tienes 2 sesiones conmigo para adaptar Builtek
a cómo trabaja [recipient_company]. En esas sesiones revisamos tus necesidades
específicas y construimos lo que haga falta.

¿Qué día de esta semana te funciona para una llamada de 30 minutos?
Mis disponibles: lunes a sábado a partir de la 1:00 pm.

Responde este email o escríbeme directo por WhatsApp.

Luis Celestin
Fundador, Builtek
```

Agregar flag `email_invite_day7_sent TIMESTAMPTZ` a tabla `invite_links`.

### 7d. Integración con `/register`

Si `?invite=<token>` presente:
1. Leer y validar invite_link del servidor: `status='pending'` y `expires_at > now()`
2. Si inválido: mensaje en formulario "Este link de invitación ya no es válido"
3. Al crear workspace: `trial_days = invite.trial_days` (30 en lugar de 14)
4. Al crear exitosamente: `status='used'`, `used_by_workspace=workspace.id`, `used_at=now()`

### 7e. Sección "Invitaciones" en `/super-admin`

Formulario:
- Nombre del contacto (requerido)
- Empresa (opcional)
- Días de trial (default 30, rango 14–90)
- Botón "Generar invitación"

Al generar: `POST /api/super-admin/invite-links` → retorna `https://builtek.mx/invitacion/[token]`

Tabla:

| Nombre | Empresa | Aperturas | Estado | Trial | Workspace creado | Acciones |
|--------|---------|-----------|--------|-------|-----------------|---------|

- Estado: badge (pending=gris, used=verde, expired=rojo)
- Acciones: botón "Copiar link" (clipboard API)

**Criterios de aceptación Feature 7:**
- [ ] Token generado automáticamente (8 chars del UUID)
- [ ] Página `/invitacion/[token]` pública sin login
- [ ] Cada apertura incrementa `open_count`
- [ ] `opened_at` se guarda solo en la primera apertura
- [ ] La página muestra nombre y empresa del destinatario
- [ ] La página menciona las 2 sesiones de personalización con Luis Celestin
- [ ] La página menciona que las sesiones se coordinan 1 semana después del registro
- [ ] Al registrarse con `?invite=token`, trial es 30 días
- [ ] Invite marcado como `used` al crear workspace
- [ ] Token usado no puede usarse para crear otro workspace
- [ ] Email día 7 se envía exactamente una vez (flag `email_invite_day7_sent`)
- [ ] Formulario super-admin genera el link y lo muestra para copiar

---

## Migraciones — orden

```
supabase/migrations/
  001_trial_columns.sql       — columnas trial + email flags en workspaces
  002_plan_change_log.sql     — tabla plan_change_log
  003_invite_links.sql        — tabla invite_links + RLS
```

El schema base (`workspaces`, `users`, `workspace_members`, `projects`, `tasks`, `documents`, `extractions`) se asume existente o se crea como migración `000_base_schema.sql` siguiendo el schema de `MASTER_PROMPT.md`.

---

## Variables de entorno nuevas

```
CRON_SECRET           — protege /api/cron/expire-trials
SUPER_ADMIN_EMAIL     — email del super-admin (Luis Celestin)
SUPER_ADMIN_SECRET    — firma la cookie de impersonation
```

Agregar a `.env.local` y documentar en `.env.example`.

---

## Archivos a crear o modificar

| Archivo | Acción |
|---------|--------|
| `src/components/PricingSection.tsx` | Modificar — CTAs Feature 1 |
| `src/middleware.ts` | Crear — proteger `/super-admin`, cookie impersonation |
| `src/app/(auth)/register/page.tsx` | Crear — formulario registro con `?plan` e `?invite` |
| `src/app/(auth)/login/page.tsx` | Crear — formulario login |
| `src/app/(auth)/layout.tsx` | Crear — layout auth sin sidebar |
| `src/app/(dashboard)/layout.tsx` | Crear — banners trial + impersonation |
| `src/app/(dashboard)/admin/page.tsx` | Crear — sección "Tu plan" + modal cambiar plan |
| `src/app/super-admin/page.tsx` | Crear — tabs Trials activos + Invitaciones |
| `src/app/invitacion/[token]/page.tsx` | Crear — página pública de invitación |
| `src/app/api/cron/expire-trials/route.ts` | Crear — cron expiración + emails |
| `src/app/api/super-admin/impersonate/route.ts` | Crear — POST crear sesión impersonation |
| `src/app/api/super-admin/impersonate/exit/route.ts` | Crear — POST salir de impersonation |
| `src/app/api/super-admin/invite-links/route.ts` | Crear — POST crear invite link |
| `src/app/api/admin/workspace/plan/route.ts` | Crear — PATCH cambiar plan |
| `src/hooks/useWorkspacePlan.ts` | Crear — hook plan/status/trial |
| `src/components/TrialExpiredModal.tsx` | Crear — modal acción bloqueada |
| `src/components/ImpersonationBanner.tsx` | Crear — banner rojo impersonation |
| `src/components/TrialBanner.tsx` | Crear — banner amber trial expirado |
| `src/lib/emails/trial-day10.tsx` | Crear — template email día 10 |
| `src/lib/emails/trial-day13.tsx` | Crear — template email día 13 |
| `src/lib/emails/trial-day14.tsx` | Crear — template email día 14 |
| `src/lib/emails/trial-day21.tsx` | Crear — template email día 21 |
| `src/lib/emails/invite-day7.tsx` | Crear — template email día 7 post-invite |
| `src/lib/supabase/server.ts` | Crear — cliente Supabase Server Components |
| `src/lib/supabase/client.ts` | Crear — cliente Supabase Client Components |
| `src/lib/supabase/admin.ts` | Crear — cliente service_role (solo server-side) |
| `supabase/migrations/001_trial_columns.sql` | Crear |
| `supabase/migrations/002_plan_change_log.sql` | Crear |
| `supabase/migrations/003_invite_links.sql` | Crear |
| `.env.example` | Crear/Modificar |

---

## Orden de implementación

1. Clientes Supabase (`server.ts`, `client.ts`, `admin.ts`)
2. Migraciones 001, 002, 003
3. Middleware (protección rutas + cookie impersonation)
4. Auth: register + login
5. Hook `useWorkspacePlan`
6. Dashboard layout + banners (TrialBanner + ImpersonationBanner)
7. Feature 1: PricingSection CTAs
8. Feature 4: Admin plan change
9. Feature 5: Impersonation endpoints + banner
10. Feature 6: Panel trials activos
11. Feature 7: Invite links completo
12. Feature 3: Emails (cron + templates)

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| `next: "16.2.12"` versión no estándar | Verificar con `npx next --version` antes de implementar |
| Cookie impersonation en Edge Runtime | Verificar disponibilidad de `crypto.subtle`; usar `jose` si es necesario |
| RLS en `invite_links` vs página pública | Usar service_role key solo en Server Component, nunca exponer al cliente |
| `last_sign_in_at` en `auth.users` vs tabla pública | Mantener `last_seen_at` en tabla `users` pública, actualizar en middleware |
| Número de WhatsApp es placeholder | Dejar `// TODO`, no bloquea deploy |

---

## Fuera de alcance

- Stripe / sistema de pagos
- OAuth Google
- Visor DWG
- CalendarView / WeeklyView
- Flujo de onboarding guiado post-registro (pendiente para siguiente sesión)
