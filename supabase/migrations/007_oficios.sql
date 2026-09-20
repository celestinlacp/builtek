-- =============================================
-- Builtek — Módulo Oficios (Frente 12)
-- Migración 007
-- =============================================

-- ── Feature flags en workspaces ──────────────────────────────────────────────
alter table workspaces add column if not exists features jsonb not null default '{}';

-- ── Siglas (initials) en profiles ─────────────────────────────────────────────
alter table profiles add column if not exists initials text;

-- Función para generar siglas desde nombre completo (ej: "Luis Antonio Celestin Preciado" → "LACP")
create or replace function generate_initials(name text)
returns text as $$
declare
  words text[];
  result text := '';
  word text;
begin
  if name is null or trim(name) = '' then
    return null;
  end if;
  words := regexp_split_to_array(trim(name), '\s+');
  foreach word in array words loop
    if length(word) > 0 then
      result := result || upper(left(word, 1));
    end if;
  end loop;
  return left(result, 4);
end;
$$ language plpgsql immutable;

-- Actualizar trigger handle_new_user para incluir initials
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, initials)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    generate_initials(new.raw_user_meta_data->>'full_name')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill initials para usuarios existentes sin siglas
update profiles
set initials = generate_initials(full_name)
where initials is null and full_name is not null;

-- ── OFICIOS ───────────────────────────────────────────────────────────────────
create table if not exists oficios (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  tipo            text not null check (tipo in ('entrada', 'salida')),
  no_oficio       text,
  asunto          text not null,
  fecha_documento date,
  proyecto_id     uuid references projects(id) on delete set null,
  especialidad    text,
  -- estado aplica principalmente a entrada; salida inicia como 'pendiente' también
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'en_atencion', 'respondido', 'archivado')),
  remitente       text,       -- entrada: quien lo envía (empresa/dependencia)
  destinatario    text,       -- salida: a quien va dirigido
  assignee_id     uuid references auth.users(id) on delete set null,
  storage_key     text,       -- clave en R2
  file_name       text,       -- nombre original del archivo
  file_type       text,       -- pdf | docx | xlsx | other
  file_size       integer,
  notas           text,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table oficios enable row level security;

-- Todos los miembros del workspace pueden leer oficios
create policy "oficios_select" on oficios
  for select using (is_workspace_member(workspace_id));

-- Cualquier miembro puede crear oficios
create policy "oficios_insert" on oficios
  for insert with check (
    is_workspace_member(workspace_id) and created_by = auth.uid()
  );

-- Owner/admin/manager pueden editar cualquier oficio; el creador puede editar el suyo
create policy "oficios_update" on oficios
  for update using (
    get_workspace_role(workspace_id) in ('owner', 'admin', 'manager')
    or created_by = auth.uid()
  );

-- Solo owner/admin pueden eliminar
create policy "oficios_delete" on oficios
  for delete using (
    get_workspace_role(workspace_id) in ('owner', 'admin')
  );

-- Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger oficios_updated_at
  before update on oficios
  for each row execute procedure update_updated_at_column();

-- ── NOTAS DE ACTIVACIÓN ────────────────────────────────────────────────────────
-- Para activar el módulo Oficios en un workspace específico, ejecutar en Supabase:
--
--   update workspaces
--   set features = features || '{"oficios": true}'::jsonb
--   where id = '<workspace_id>';
--
-- El workspace_id se muestra en Admin > Configuración > Config.
