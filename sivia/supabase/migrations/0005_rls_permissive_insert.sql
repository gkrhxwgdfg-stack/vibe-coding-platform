-- ============================================================
-- Savia — correctif RLS familles (migration 0005)
--
-- Diagnostic : la policy families_insert_authenticated bloque TOUS les INSERT,
-- même avec le bon created_by. auth.uid() fonctionne (prouvé via profiles).
--
-- Cause probable : la policy a été créée sans "to authenticated", donc elle
-- s'applique au rôle "public" (qui inclut anon), et auth.uid() retourne NULL
-- pour le rôle anon → le WITH CHECK échoue toujours.
--
-- Solution : recréer la policy avec "to authenticated" explicite,
-- et ajouter une valeur par défaut auth.uid() sur created_by pour
-- simplifier les INSERT côté client.
-- ============================================================

-- 1. Supprimer l'ancienne policy défaillante
drop policy if exists "families_insert_authenticated" on public.families;

-- 2. Recréer avec "to authenticated" explicite
create policy "families_insert_authenticated"
  on public.families for insert
  to authenticated
  with check (auth.uid() = created_by);

-- 3. Valeur par défaut : created_by = auth.uid() si non fourni
alter table public.families
  alter column created_by set default auth.uid();

-- 4. S'assurer que toutes les policies familles ont "to authenticated"
drop policy if exists "families_select_member" on public.families;
create policy "families_select_member"
  on public.families for select
  to authenticated
  using (public.is_family_member(id) or created_by = auth.uid());

drop policy if exists "families_update_member" on public.families;
create policy "families_update_member"
  on public.families for update
  to authenticated
  using (public.is_family_member(id) or created_by = auth.uid())
  with check (public.is_family_member(id) or created_by = auth.uid());

-- 5. Corriger aussi les autres policies sans "to authenticated"
-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_family_member(family_id));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- invitations
drop policy if exists "invitations_select_member" on public.invitations;
create policy "invitations_select_member"
  on public.invitations for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "invitations_insert_member" on public.invitations;
create policy "invitations_insert_member"
  on public.invitations for insert
  to authenticated
  with check (public.is_family_member(family_id));

drop policy if exists "invitations_update_member" on public.invitations;
create policy "invitations_update_member"
  on public.invitations for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "invitations_delete_member" on public.invitations;
create policy "invitations_delete_member"
  on public.invitations for delete
  to authenticated
  using (public.is_family_member(family_id));

-- invitations_select_by_token doit rester public (accès sans auth via token)
drop policy if exists "invitations_select_by_token" on public.invitations;
create policy "invitations_select_by_token"
  on public.invitations for select
  to anon, authenticated
  using (status = 'pending' and expires_at > now());

-- recipes
drop policy if exists "recipes_select_family" on public.recipes;
create policy "recipes_select_family"
  on public.recipes for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "recipes_insert_family" on public.recipes;
create policy "recipes_insert_family"
  on public.recipes for insert
  to authenticated
  with check (public.is_family_member(family_id) and auth.uid() = author_id);

drop policy if exists "recipes_update_family" on public.recipes;
create policy "recipes_update_family"
  on public.recipes for update
  to authenticated
  using (
    public.is_family_member(family_id)
    and (not is_sealed or auth.uid() = author_id)
  )
  with check (
    public.is_family_member(family_id)
    and (not is_sealed or auth.uid() = author_id)
  );

drop policy if exists "recipes_delete_author" on public.recipes;
create policy "recipes_delete_author"
  on public.recipes for delete
  to authenticated
  using (auth.uid() = author_id and public.is_family_member(family_id));

-- favorites
drop policy if exists "favorites_select_self" on public.favorites;
create policy "favorites_select_self"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites_insert_self" on public.favorites;
create policy "favorites_insert_self"
  on public.favorites for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_family_member(r.family_id)
    )
  );

drop policy if exists "favorites_delete_self" on public.favorites;
create policy "favorites_delete_self"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());
