-- ============================================================
-- Savia — correctif RLS profiles
-- Le self-healing côté client fait un INSERT puis un UPDATE si
-- la ligne existe déjà. L'upsert (INSERT ... ON CONFLICT DO UPDATE)
-- n'est pas possible car les policies RLS n'ont pas de clause
-- WITH CHECK sur l'UPDATE implicite d'un upsert.
-- On ajoute donc la policy update manquante sur son propre profil.
-- ============================================================

-- Mise à jour de son propre profil : autorisée (update_self existait
-- mais avec un USING seul, sans WITH CHECK — insuffisant pour un upsert)
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
