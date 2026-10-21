-- ============================================================
-- Sivia — arbre : « relié à » une ou deux personnes
-- (migration 0011)
--
-- Le formulaire de l'arbre est simplifié : « Relié à … » accepte une
-- personne, ou deux (ex : un enfant relié à maman ET à papa).
-- parent2_id enregistre le second référent (le premier reste parent_id).
-- ============================================================

alter table public.family_members
  add column if not exists parent2_id uuid
  references public.family_members (id) on delete set null;

create index if not exists family_members_parent2_idx
  on public.family_members (parent2_id);
