# Onboarding Wizard Extendido + Welcome Checklist

**Proyecto:** Builtek
**Fecha:** 2026-10-25
**Branch:** forge/20261025-onboarding-wizard-checklist

## Objetivo

Mejorar la experiencia de primer uso añadiendo un paso "Primer proyecto" al wizard de onboarding y un widget de welcome checklist en el dashboard, para reducir el tiempo hasta el primer valor del usuario nuevo.

## Parte A — Wizard extendido (4 pasos)

El array `STEPS` cambia de `['Empresa', 'Equipo', 'Listo']` a `['Empresa', 'Equipo', 'Proyecto', 'Listo']`.

### Paso 2 — "Primer proyecto"
- Campo texto **Nombre del proyecto** (requerido para continuar)
- Campo texto **Código corto** (3–5 letras mayúsculas, sugerido automáticamente con las iniciales del nombre: tomar primera letra de cada palabra, truncar a 5, mayúsculas). El usuario puede editarlo. Validar en tiempo real: solo A-Z, mínimo 3, máximo 5. Botón Continuar deshabilitado si inválido.
- Upload de **imagen de portada** (opcional). Input `type="file"` accept `image/*`. Preview thumbnail si se sube. Si no se sube imagen, `cover_image_url` queda null.

### Paso 3 — "Listo" (actualizado)
- Fila "Plan" muestra: "Trial 14 días — plan Obra" en verde

### Animaciones
- Framer Motion para transiciones entre pasos: slide horizontal (sale izquierda, entra derecha)
- Progress bar anima su fill con `motion.div`
- `npm install framer-motion` requerido

### Server Action
`createWorkspace` recibe también `project_name`, `project_code`, `cover_image_url`. Después de crear el workspace, inserta fila en `projects` con esos datos.

La imagen se sube a Supabase Storage bucket `project-covers` con path `{workspace_id}/{project_id}.{ext}` desde el cliente antes de llamar a la action.

## Parte B — Welcome Checklist en dashboard

Widget en `dashboard/page.tsx`, encima de los KPIs, visible solo hasta completar todos los items.

### Items
1. ✅ Workspace creado — siempre completado
2. ✅ Primer proyecto creado — completado si `projects.length > 0`
3. [ ] Sube tu primer documento — completado si existe al menos 1 documento en el workspace
4. [ ] Invita a un compañero — completado si `members.length >= 2`
5. [ ] Asigna tu primera tarea — completado si existe tarea con `assignee_id` no nulo
6. [ ] Prueba el Agente AI — se marca al hacer clic, persiste en BD

Al completar todos: colapsa con animación height → 0 (Framer Motion), muestra brevemente mensaje de felicitación, desaparece. No reaparece en futuros accesos.

### Animaciones
- Check icon: `scale` 0→1 + `opacity` 0→1 con Framer Motion
- Colapso final del widget: `AnimatePresence` + `motion.div` con `height: 0, opacity: 0`

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/app/onboarding/OnboardingForm.tsx` | Modificar — agregar paso Proyecto, estados, autosugerencia código, upload imagen, animaciones |
| `src/app/onboarding/actions.ts` | Modificar — recibir project_name, project_code, cover_image_url; crear proyecto en BD |
| `src/app/(dashboard)/dashboard/page.tsx` | Modificar — pasar props a WelcomeChecklist, importar componente |
| `src/app/(dashboard)/dashboard/WelcomeChecklist.tsx` | Crear — componente cliente con items, animaciones, fetch/upsert |
| `supabase/migrations/004_onboarding_checklist.sql` | Crear — tabla onboarding_checklist + RLS |

> Nota: usar número de migración que no colisione con existentes. Verificar el último número en `supabase/migrations/` antes de crear.

## SQL

```sql
CREATE TABLE onboarding_checklist (
  workspace_id     UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  ai_agent_tried   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read own checklist"
  ON onboarding_checklist FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can upsert own checklist"
  ON onboarding_checklist FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can update own checklist"
  ON onboarding_checklist FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

## Decisiones clave

1. **Estado del checklist:** Solo persiste `ai_agent_tried` y `completed_at`. Los demás items se derivan de datos existentes en tiempo real.
2. **Upload imagen:** Desde el cliente antes de llamar a la Server Action. La action recibe solo la URL.
3. **Código corto autosugerido:** Primeras letras de cada palabra, mayúsculas, truncado a 5.
4. **Props del WelcomeChecklist:** Server Component pasa `hasProject`, `hasDocument`, `hasTeamMember`, `hasAssignedTask` como booleanas. El componente cliente solo hace 1 fetch para `onboarding_checklist`.
5. **Posición en dashboard:** Después del header, antes del bento grid de proyectos.

## Fuera de alcance

- No modificar el flujo de invitación (el item solo verifica conteo de miembros)
- No lógica de billing ni cambio real de plan
- No datos de ejemplo adicionales
- Solo aplica al owner del workspace
