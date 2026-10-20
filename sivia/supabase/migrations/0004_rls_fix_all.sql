-- ============================================================
-- Savia — correctif RLS complet (migration 0004)
--
-- Problèmes constatés en production :
-- 1. La policy families_insert_authenticated existe mais l'INSERT échoue
--    systématiquement (403). Cause probable : la policy a été créée
--    AVANT l'activation de la RLS, ou une autre policy bloque.
-- 2. Le bucket recipe-photos n'existe pas (migration 0002 non appliquée).
-- 3. La table favorites n'a pas de colonne id (PK composite user_id+recipe_id),
--    ce qui casse les requêtes select('id').
--
-- Cette migration est IDEMPOTENTE : elle peut être réexécutée sans danger.
-- ============================================================

-- ---------- 1. Recréer proprement la policy INSERT sur families ----------

drop policy if exists "families_insert_authenticated" on public.families;
create policy "families_insert_authenticated"
  on public.families for insert
  to authenticated
  with check (auth.uid() = created_by);

-- ---------- 2. S'assurer que la RLS est bien activée ----------

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.recipes enable row level security;
alter table public.favorites enable row level security;

-- ---------- 3. Policy SELECT : un utilisateur connecté voit sa famille ----------
-- (utile pour l'onboarding avant d'être rattaché)

drop policy if exists "families_select_member" on public.families;
create policy "families_select_member"
  on public.families for select
  to authenticated
  using (public.is_family_member(id) or created_by = auth.uid());

-- ---------- 4. Policy UPDATE/DELETE familles ----------

drop policy if exists "families_update_member" on public.families;
create policy "families_update_member"
  on public.families for update
  to authenticated
  using (public.is_family_member(id) or created_by = auth.uid())
  with check (public.is_family_member(id) or created_by = auth.uid());

-- ---------- 5. Corriger la policy profiles_update_self (WITH CHECK) ----------

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- 6. Recréer le bucket recipe-photos ----------

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- ---------- 7. Policies storage ----------

drop policy if exists "photos_read_public" on storage.objects;
create policy "photos_read_public"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

drop policy if exists "photos_upload_family" on storage.objects;
create policy "photos_upload_family"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "photos_delete_family" on storage.objects;
create policy "photos_delete_family"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );

-- ---------- 8. Trigger handle_new_user (idempotent) ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
