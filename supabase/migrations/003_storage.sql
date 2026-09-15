-- =============================================
-- Builtek — Supabase Storage
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Agregar columna storage_path a documents
alter table documents add column if not exists storage_path text;

-- Crear bucket (público — URLs son opacas por UUID)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Políticas de storage
create policy "members can read documents"
on storage.objects for select
using (bucket_id = 'documents' and auth.uid() is not null);

create policy "members can upload documents"
on storage.objects for insert
with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "members can delete documents"
on storage.objects for delete
using (bucket_id = 'documents' and auth.uid() is not null);
