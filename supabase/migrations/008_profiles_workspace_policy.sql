-- Allow workspace members to see profiles of other members in their workspace
drop policy if exists "profiles_select" on profiles;

create policy "profiles_select" on profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from workspace_members wm1
    join workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
    where wm1.user_id = auth.uid()
      and wm2.user_id = profiles.id
  )
);
