---
date: 2026-11-06
project: builtek
feature: bitacora-visual-fase1
tags: [forge, spec, bitacora, photos]
---

# Spec — Bitácora Visual Fase 1

## Objetivo

Construir el módulo de Bitácora Visual de Builtek: infraestructura de almacenamiento de fotos de obra con timeline mensual, thumbnails automáticos en R2, y gestión básica de tags — para que equipos AEC documenten el avance fotográfico de sus proyectos.

## Contexto

Los equipos de construcción en LATAM documentan el avance de obra tomando fotos desde campo, pero las gestionan en WhatsApp o carpetas sin estructura. Builtek necesita un módulo de registro visual cronológico que sea la fuente de verdad fotográfica del proyecto. Esta Fase 1 establece la infraestructura base (storage, DB, API) y la vista principal de timeline; las fases 2-4 añadirán pineado en planos, anotaciones y dashboard de almacenamiento.

## Decisiones arquitectónicas

1. **Storage R2 — dos prefijos:** `photos/hot/{workspace_id}/{photo_id}.webp` para thumbnails WebP 400px, y `photos/cold/{workspace_id}/{photo_id}.{ext}` para el original. Mismo bucket que documentos.
2. **Thumbnails:** Sharp se ejecuta en la API route `/api/photos/process` en background (después de responder al cliente) — el usuario no espera el procesamiento.
3. **Planos:** Solo PDFs en esta fase. DWG queda para fase posterior.
4. **Anotaciones:** El campo `annotations_json` existe en la tabla `photos` pero es nullable — Fabric.js se implementa en Fase 3.
5. **Esta es Fase 1:** Scope limitado a infra + timeline. No incluye split-view modal, pineado en planos, ni dashboard de storage.
6. **Tags:** Globales por workspace (`photo_tags`), reutilizables. Se crean inline desde el modal de detalle de foto.

## Schema SQL

```sql
-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN: bitacora_visual_fase1
-- ═══════════════════════════════════════════════════════

CREATE TABLE photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  name             TEXT,
  captured_at      TIMESTAMPTZ NOT NULL,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by      UUID REFERENCES auth.users(id),
  storage_key_hot  TEXT NOT NULL,
  storage_key_cold TEXT NOT NULL,
  file_size        BIGINT,
  width            INT,
  height           INT,
  is_favorite      BOOLEAN NOT NULL DEFAULT FALSE,
  tier_storage     TEXT NOT NULL DEFAULT 'hot' CHECK (tier_storage IN ('hot','cold')),
  annotations_json JSONB,
  exif_data        JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_workspace_captured ON photos(workspace_id, captured_at DESC);
CREATE INDEX idx_photos_workspace_project  ON photos(workspace_id, project_id);
CREATE INDEX idx_photos_favorite           ON photos(workspace_id, is_favorite) WHERE is_favorite = TRUE;

CREATE TABLE photo_tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#6366f1',
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

CREATE TABLE photo_tag_assignments (
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES photo_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (photo_id, tag_id)
);

-- RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select" ON photos FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_insert" ON photos FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_update" ON photos FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photos_delete" ON photos FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "photo_tags_select" ON photo_tags FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "photo_tags_insert" ON photo_tags FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));
CREATE POLICY "photo_tags_update" ON photo_tags FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));
CREATE POLICY "photo_tags_delete" ON photo_tags FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

CREATE POLICY "pta_select" ON photo_tag_assignments FOR SELECT
  USING (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "pta_insert" ON photo_tag_assignments FOR INSERT
  WITH CHECK (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "pta_delete" ON photo_tag_assignments FOR DELETE
  USING (photo_id IN (
    SELECT id FROM photos WHERE workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));
```

## Dependencias nuevas

```bash
npm install sharp exifr
npm install --save-dev @types/sharp
```

- `sharp`: procesamiento de imagen server-side (thumbnail WebP 400px). Version recomendada: `^0.33`.
- `exifr`: extraccion EXIF client-side en browser (DateTimeOriginal). Version recomendada: `^7`.

## Alcance

### Incluido

1. Migracion SQL: tablas `photos`, `photo_tags`, `photo_tag_assignments` con indices y RLS
2. Tipos TypeScript: `Photo`, `PhotoTag`, `PhotoTagAssignment`
3. API route `POST /api/photos/presign` — URL presigned para upload directo a R2 `/cold/`
4. API route `POST /api/photos/process` — thumbnail Sharp→R2 `/hot/` + insercion DB en background
5. API route `GET /api/photos/thumb/[id]` — redirect 302 firmado al thumbnail
6. Server actions: `deletePhotos`, `toggleFavorite`, `updatePhotoTags`, `createPhotoTag`, `updatePhotoMeta`
7. `PhotoUploadModal` — drag & drop, EXIF extraction, batch hasta 20 fotos, barra de progreso
8. Pagina `/bitacora` — SSR, hero image, filtro por proyecto
9. `PhotoTimeline` — sticky headers por mes, time scrubber lateral con IntersectionObserver
10. `PhotoCard` — thumbnail, chips tags, estrella favorito, checkbox multi-select
11. `PhotoDetailModal` — full-screen, edicion nombre/proyecto/tags, navegacion teclado
12. `TagSelector` — dropdown con creacion inline de tags
13. `MultiSelectToolbar` — toolbar flotante, eliminar en batch

### Excluido (Fases 2-4)

- Pineado de fotos en planos PDF/DWG (Fase 2)
- Split-view modal plano+foto (Fase 2)
- Anotaciones con Fabric.js (Fase 3)
- Dashboard de storage / metricas R2 (Fase 4)

## Tickets

### T01 — Migracion SQL y RLS

**Archivo(s):** `supabase/migrations/20261106000000_bitacora_visual_fase1.sql`

**Que hace:** Crea las tres tablas del schema, los indices de rendimiento, y todas las politicas RLS.

**Criterios de aceptacion:**
- [ ] La migracion se aplica sin errores
- [ ] Un usuario solo ve las fotos de su workspace (RLS SELECT verificado)
- [ ] Los indices `idx_photos_workspace_captured` y `idx_photos_workspace_project` existen
- [ ] `UNIQUE(workspace_id, name)` en `photo_tags` impide duplicados de nombre por workspace

---

### T02 — Tipos TypeScript

**Archivo(s):** `src/types/index.ts` (anadir al final)

**Que hace:** Declara `Photo`, `PhotoTag`, `PhotoTagAssignment`. `Photo` incluye campo opcional `tags?: PhotoTag[]` para joins con eager-loading.

**Criterios de aceptacion:**
- [ ] `Photo` contiene todos los campos de la tabla con tipos nullable correctos
- [ ] `PhotoTag` contiene `id`, `workspace_id`, `name`, `color`, `created_at`
- [ ] Build TypeScript sin errores

---

### T03 — API POST /api/photos/presign

**Archivo(s):** `src/app/api/photos/presign/route.ts`

**Que hace:** Recibe `{ workspaceId, fileName, contentType, fileSize, photoId }`. Verifica membresia. Construye storage key `photos/cold/{workspaceId}/{photoId}.{ext}`. Devuelve URL presigned PUT para R2 (expira 5 min). Solo acepta content types de imagen.

**Body request:** `{ workspaceId, fileName, contentType, fileSize, photoId }`
**Body response (200):** `{ uploadUrl, storageKeyCold, photoId }`

**Criterios de aceptacion:**
- [ ] 401 si no autenticado, 403 si no es miembro del workspace
- [ ] 400 para content types que no sean imagen
- [ ] Storage key sigue el patron `photos/cold/{workspaceId}/{photoId}.{ext}`
- [ ] Acepta: `image/jpeg`, `image/png`, `image/heic`, `image/heif`, `image/webp`

---

### T04 — API POST /api/photos/process

**Archivo(s):** `src/app/api/photos/process/route.ts`

**Que hace:** Responde 202 inmediatamente. En background: descarga original de R2, genera thumbnail WebP 400px con Sharp (aspect ratio preservado, calidad 85), sube a `photos/hot/{workspaceId}/{photoId}.webp`, inserta en DB. Fallback si Sharp falla: inserta con `storage_key_hot = storage_key_cold` y `tier_storage = 'cold'`.

**Body request:**
```json
{
  "workspaceId": "uuid",
  "projectId": "uuid|null",
  "photoId": "uuid",
  "name": "string|null",
  "capturedAt": "ISO8601",
  "storageKeyCold": "string",
  "fileSize": 0,
  "width": 0,
  "height": 0,
  "exifData": {}
}
```

**Criterios de aceptacion:**
- [ ] Responde 202 en menos de 300ms
- [ ] Thumbnail en `photos/hot/{workspaceId}/{photoId}.webp` tras background job
- [ ] Registro en DB existe despues del procesamiento (max 10s para foto de 5MB)
- [ ] Si Sharp falla, registro se inserta igual con `tier_storage = 'cold'`

---

### T05 — Server actions

**Archivo(s):** `src/app/(dashboard)/bitacora/actions.ts`

**Actions:**
- `deletePhotos(photoIds, workspaceId)` — borra DB + R2 hot y cold. Verifica ownership.
- `toggleFavorite(photoId, isFavorite)` — actualiza `is_favorite`
- `updatePhotoTags(photoId, tagIds)` — reemplaza asignaciones (delete + insert)
- `createPhotoTag(workspaceId, name, color)` — inserta tag, devuelve el creado
- `updatePhotoMeta(photoId, { name?, project_id? })` — actualiza metadatos

**Criterios de aceptacion:**
- [ ] `deletePhotos` borra DB y ambos keys R2 (hot + cold)
- [ ] `deletePhotos` no borra fotos de otro workspace
- [ ] `updatePhotoTags` es idempotente
- [ ] `createPhotoTag` devuelve error descriptivo si el nombre ya existe
- [ ] Todas llaman `revalidatePath('/bitacora')`

---

### T06 — PhotoUploadModal

**Archivo(s):** `src/app/(dashboard)/bitacora/components/PhotoUploadModal.tsx`

**Que hace:** Modal de subida batch. Acepta hasta 20 archivos via drag & drop o picker. Por cada archivo: (1) extrae EXIF con `exifr` para `DateTimeOriginal`, (2) genera `photoId = crypto.randomUUID()`, (3) llama `/api/photos/presign`, (4) PUT directo a R2, (5) llama `/api/photos/process`. Muestra progreso individual por foto.

**Props:** `{ workspaceId, projectId?, onClose }`

**Criterios de aceptacion:**
- [ ] Extrae `DateTimeOriginal` de EXIF cuando existe; usa fecha actual como fallback
- [ ] Acepta drag & drop y click
- [ ] Rechaza archivos que no sean imagenes con mensaje claro
- [ ] Muestra barra de progreso individual por archivo
- [ ] Llama `router.refresh()` al completar todas las subidas
- [ ] Funciona con 1 y con 20 fotos

---

### T07 — Pagina /bitacora

**Archivo(s):** `src/app/(dashboard)/bitacora/page.tsx`

**Que hace:** Server Component. Carga fotos del workspace (200 mas recientes, `captured_at DESC`). Carga proyectos para filtro. Renderiza: hero image + header + `PhotoTimeline`. Acepta `?project=<uuid>` para filtrar.

**Criterios de aceptacion:**
- [ ] Carga y renderiza sin errores en SSR
- [ ] Filtro por proyecto funciona via URL
- [ ] Hero image: favorita mas reciente, o mas reciente si no hay favorita
- [ ] Estado vacio con CTA si no hay fotos

---

### T08 — PhotoTimeline

**Archivo(s):** `src/app/(dashboard)/bitacora/components/PhotoTimeline.tsx`

**Que hace:** Client Component. Agrupa fotos por mes/ano. Sticky headers `position: sticky top-[64px]`. Grid 3/2/1 columnas responsive. Time scrubber lateral: punto por mes, resalta mes en viewport via IntersectionObserver, click hace scroll suave.

**Props:**
```ts
{
  photos: Photo[]
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onSelectAll: () => void
  onClearSelection: () => void
  onPhotoClick: (photo: Photo) => void
}
```

**Criterios de aceptacion:**
- [ ] Sticky headers visibles durante scroll
- [ ] Time scrubber resalta mes activo en viewport
- [ ] Click en punto del scrubber hace scroll suave al mes
- [ ] Grid responsive: 3 col desktop / 2 col tablet / 1 col mobile

---

### T09 — PhotoCard

**Archivo(s):** `src/app/(dashboard)/bitacora/components/PhotoCard.tsx`

**Que hace:** Client Component. Thumbnail via `/api/photos/thumb/[id]`. Overlay: estrella favorito, checkbox seleccion, chips primeros 2 tags (+N si hay mas), fecha captura.

**Props:** `{ photo, isSelected, onSelect, onClick }`

**Criterios de aceptacion:**
- [ ] Thumbnail carga correctamente
- [ ] Checkbox visible en hover y cuando esta seleccionado
- [ ] Estrella refleja `is_favorite` y llama `toggleFavorite` al hacer click
- [ ] Chips muestran max 2 tags con "+N" si hay mas

---

### T10 — API GET /api/photos/thumb/[id]

**Archivo(s):** `src/app/api/photos/thumb/[id]/route.ts`

**Que hace:** Verifica auth y membresia. Obtiene `storage_key_hot` del photo. Genera URL firmada R2 (expira 1h). Responde 302 redirect. Sigue patron de `src/app/api/drive/view/[id]/route.ts`.

**Criterios de aceptacion:**
- [ ] 401 si no autenticado, 403 si foto no es del workspace del usuario
- [ ] 302 redirect a URL firmada valida por 1 hora

---

### T11 — PhotoDetailModal

**Archivo(s):** `src/app/(dashboard)/bitacora/components/PhotoDetailModal.tsx`

**Que hace:** Client Component. Modal full-screen. Foto a 70% del ancho. Panel lateral: nombre editable, selector proyecto, `TagSelector`, toggle favorito, fecha/dimensiones/tamano. Navegacion teclado ←/→. Cierre con Escape o click en overlay.

**Props:** `{ photo, photos, workspaceProjects, workspaceTags, onClose, onUpdate }`

**Criterios de aceptacion:**
- [ ] Cambios de nombre/proyecto/tags se guardan con server actions
- [ ] Navegacion ←/→ con teclado funciona
- [ ] Cierre con Escape funciona
- [ ] No se cierra al hacer click dentro del modal

---

### T12 — TagSelector

**Archivo(s):** `src/app/(dashboard)/bitacora/components/TagSelector.tsx`

**Que hace:** Client Component reutilizable. Dropdown con tags del workspace + checkboxes. Input para crear tag nuevo inline con paleta de 8 colores. Al crear, llama `createPhotoTag` y anade a lista local sin recargar.

**Paleta:** `['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6']`

**Props:** `{ workspaceId, availableTags, selectedTagIds, onChange }`

**Criterios de aceptacion:**
- [ ] Tags con su color en la lista
- [ ] Se puede crear tag nuevo sin cerrar el dropdown
- [ ] Tag nuevo aparece en lista inmediatamente
- [ ] No se puede crear tag con nombre vacio

---

### T13 — MultiSelectToolbar

**Archivo(s):** `src/app/(dashboard)/bitacora/components/MultiSelectToolbar.tsx`

**Que hace:** Client Component. Fixed bottom, aparece cuando `selectedIds.size > 0`. Muestra cuenta de seleccionadas, botones Seleccionar todo / Deseleccionar / Eliminar (con confirm). Al eliminar llama `deletePhotos` y limpia seleccion.

**Props:** `{ selectedIds, totalCount, workspaceId, onSelectAll, onClearSelection, onDeleted }`

**Criterios de aceptacion:**
- [ ] Solo visible cuando hay >= 1 foto seleccionada
- [ ] Eliminar muestra dialog de confirmacion
- [ ] Tras eliminar, toolbar desaparece y timeline se actualiza
- [ ] Seleccionar todo selecciona todas las fotos cargadas

---

## Criterios de aceptacion globales

- [ ] Usuario puede subir 5 fotos en batch y verlas en el timeline en < 3 segundos desde que termina el ultimo upload
- [ ] Sticky headers de mes funcionan correctamente durante scroll vertical
- [ ] Time scrubber salta al mes correcto al hacer click
- [ ] Multi-select + delete limpia DB y R2 (hot y cold)
- [ ] RLS: usuario de workspace A no ve fotos de workspace B
- [ ] `npm run build` completa sin errores TypeScript
- [ ] Sharp genera thumbnails WebP 400px correctamente
- [ ] `exifr` extrae `DateTimeOriginal` de fotos JPEG con EXIF
- [ ] Hero image carga la foto correcta (favorita mas reciente o mas reciente)
- [ ] Pagina `/bitacora` carga en < 2 segundos con 200 fotos

## Archivos a crear o modificar

| Archivo | Accion |
|---------|--------|
| `supabase/migrations/20261106000000_bitacora_visual_fase1.sql` | Crear |
| `src/types/index.ts` | Modificar — anadir Photo, PhotoTag, PhotoTagAssignment |
| `src/app/api/photos/presign/route.ts` | Crear |
| `src/app/api/photos/process/route.ts` | Crear |
| `src/app/api/photos/thumb/[id]/route.ts` | Crear |
| `src/app/(dashboard)/bitacora/page.tsx` | Crear |
| `src/app/(dashboard)/bitacora/actions.ts` | Crear |
| `src/app/(dashboard)/bitacora/components/PhotoTimeline.tsx` | Crear |
| `src/app/(dashboard)/bitacora/components/PhotoCard.tsx` | Crear |
| `src/app/(dashboard)/bitacora/components/PhotoDetailModal.tsx` | Crear |
| `src/app/(dashboard)/bitacora/components/PhotoUploadModal.tsx` | Crear |
| `src/app/(dashboard)/bitacora/components/TagSelector.tsx` | Crear |
| `src/app/(dashboard)/bitacora/components/MultiSelectToolbar.tsx` | Crear |

## Constraints del stack

- Next.js 15 + React 19, Tailwind CSS 4
- Supabase JS `^2.110.8`, SSR `^0.12.3`
- R2 via `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`
- Sharp y exifr: NO instalados, instalar antes de implementar
- Patron admin client: `createClient as createAdmin` inline en cada actions.ts (NO usar helper centralizado)
- Multi-tenant: todas las queries filtran por `workspace_id`
- Deploy: `npm run ship` = `railway up --detach`
