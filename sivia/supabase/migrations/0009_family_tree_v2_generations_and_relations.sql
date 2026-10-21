-- ============================================================
-- Sivia — arbre généalogique v2 : générations nommées, édition,
-- liens familiaux typés et corde
-- (migration 0009)
--
-- Évolutions de l'arbre (0008) :
-- 1. family_generations : les générations sont nommées (« Les aînés »,
--    « Les cousins »…), ordonnées, et apparaissent comme onglets.
--    Au début, seule existe la « génération 0 » (membres non classés :
--    generation_id = null).
-- 2. family_members.generation (entier) est remplacé par generation_id
--    (référence vers une génération nommée).
-- 3. family_members.relation_label : libellé du lien vers le référent
--    (parent_id) — « enfant de », « cousine de », « neveu de »… — pour
--    différencier les liens (un cousin n'est pas un enfant).
-- ============================================================

-- ---------- family_generations : les générations nommées ----------

create table if not exists public.family_generations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  /** Ordre d'affichage des onglets (1 = premier onglet nommé) */
  position integer not null default 1 check (position >= 1),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists family_generations_family_idx
  on public.family_generations (family_id, position);

alter table public.family_generations enable row level security;

-- Toute la famille lit les générations
drop policy if exists "family_generations_select_family" on public.family_generations;
create policy "family_generations_select_family"
  on public.family_generations for select
  to authenticated
  using (public.is_family_member(family_id));

-- Tout membre connecté peut créer une génération
drop policy if exists "family_generations_insert_family" on public.family_generations;
create policy "family_generations_insert_family"
  on public.family_generations for insert
  to authenticated
  with check (
    public.is_family_member(family_id)
    and created_by = auth.uid()
  );

-- Tout membre peut renommer une génération
drop policy if exists "family_generations_update_family" on public.family_generations;
create policy "family_generations_update_family"
  on public.family_generations for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

-- Suppression : les membres de la génération redeviennent « non classés » (génération 0)
drop policy if exists "family_generations_delete_family" on public.family_generations;
create policy "family_generations_delete_family"
  on public.family_generations for delete
  to authenticated
  using (public.is_family_member(family_id));

-- ---------- family_members : génération nommée + lien typé ----------

-- L'ancien entier `generation` est remplacé par une référence nommée
alter table public.family_members drop column if exists generation;
alter table public.family_members
  add column if not exists generation_id uuid
  references public.family_generations (id) on delete set null;

-- Libellé du lien vers le référent (parent_id) :
-- « enfant de », « cousine de », « neveu de »…
alter table public.family_members
  add column if not exists relation_label text
  check (relation_label is null or char_length(relation_label) <= 40);
