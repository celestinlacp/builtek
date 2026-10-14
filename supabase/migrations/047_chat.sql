-- ============================================================
-- Migración 047 — Chat interno del workspace
-- ============================================================

-- Conversaciones (canal público o DM)
CREATE TABLE chat_conversations (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('public', 'dm')),
  name         text,         -- "General" para canal público, null para DM
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Miembros por conversación + timestamp de última lectura
CREATE TABLE chat_members (
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Mensajes
CREATE TABLE chat_messages (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Suscripciones push del navegador
CREATE TABLE push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint     text NOT NULL,
  subscription jsonb NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

-- Índices
CREATE INDEX ON chat_messages (conversation_id, created_at DESC);
CREATE INDEX ON chat_messages (workspace_id);
CREATE INDEX ON chat_members (user_id);
CREATE INDEX ON push_subscriptions (user_id);

-- RLS
ALTER TABLE chat_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_conv_select"  ON chat_conversations FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "chat_conv_insert"  ON chat_conversations FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "chat_members_select" ON chat_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conversation_id AND is_workspace_member(c.workspace_id)
  ));

CREATE POLICY "chat_members_insert" ON chat_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conversation_id AND is_workspace_member(c.workspace_id)
  ));

CREATE POLICY "chat_members_update" ON chat_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "chat_msg_select" ON chat_messages FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "chat_msg_insert" ON chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND is_workspace_member(workspace_id));

CREATE POLICY "push_sub_all" ON push_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Habilitar Realtime en chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
