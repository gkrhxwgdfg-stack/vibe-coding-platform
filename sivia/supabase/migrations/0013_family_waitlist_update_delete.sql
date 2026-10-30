-- Migration 0013 — family_waitlist : policies UPDATE et DELETE
--
-- Constat du test de bout en bout (30 octobre 2026) : l'application inscrit la
-- famille avec un upsert (INSERT ... ON CONFLICT DO UPDATE), ce qui exige une
-- policy UPDATE dès qu'une ligne existe déjà (une seule ligne par famille,
-- contrainte unique). Sans elle, le bouton « Rejoindre la liste d'attente »
-- échoue avec une erreur RLS (42501).
--
-- Idempotent : peut être rejoué sans erreur.

-- Un membre peut corriger l'inscription de sa famille (note, personne qui inscrit)
create policy "waitlist_update_family"
  on public.family_waitlist
  for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

-- Un membre peut retirer sa famille de la liste (changement d'avis : la promesse est tenue)
create policy "waitlist_delete_family"
  on public.family_waitlist
  for delete
  to authenticated
  using (public.is_family_member(family_id));
