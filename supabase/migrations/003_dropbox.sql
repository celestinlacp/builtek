-- Columnas Dropbox en workspaces
alter table workspaces
  add column if not exists dropbox_token   text,
  add column if not exists dropbox_account text;

-- Columna dropbox_path en documents
alter table documents
  add column if not exists dropbox_path text;
