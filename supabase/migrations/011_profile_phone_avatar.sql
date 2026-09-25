-- =============================================
-- 011 — Perfil: campo phone + bucket avatars
-- =============================================

-- Agregar teléfono al perfil (opcional, para integración WhatsApp con Menvio)
alter table profiles add column if not exists phone text;

-- Bucket público para avatares de usuario
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Cualquier usuario autenticado puede leer avatares (son públicos)
create policy "avatars_select" on storage.objects for select
using (bucket_id = 'avatars');

-- Solo el propio usuario puede subir/actualizar/borrar su avatar
-- path esperado: {user_id}/{filename}
create policy "avatars_insert" on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid() is not null);

create policy "avatars_update" on storage.objects for update
using (bucket_id = 'avatars' and auth.uid() is not null);

create policy "avatars_delete" on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid() is not null);
