-- ============================================================
-- Savia — bucket Storage (photos de recettes)
-- À exécuter si le bucket n'existe pas (le script initial a pu
-- échouer partiellement si exécuté en plusieurs fois).
-- ============================================================

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Lecture publique des photos (le lien familial est le garde-fou)
drop policy if exists "photos_read_public" on storage.objects;
create policy "photos_read_public"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

-- Upload : membres d'une famille, dans un dossier nommé par leur family_id
drop policy if exists "photos_upload_family" on storage.objects;
create policy "photos_upload_family"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );

-- Suppression : membre de la famille du dossier
drop policy if exists "photos_delete_family" on storage.objects;
create policy "photos_delete_family"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );
