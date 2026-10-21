-- ============================================================
-- Sivia — arbre généalogique & événements de famille
-- (migration 0008)
--
-- Deux nouveautés pour la section Famille :
-- 1. family_members : les membres « de l'arbre » (sans compte, ex :
--    « Mamie Jeanne »), ajoutés manuellement par la famille. Ils
--    peuvent être cités comme origine d'une recette, mais n'ont pas
--    accès à l'application.
-- 2. family_events + event_recipes : les repas de famille (Noël 2026,
--    anniversaire de Papi…) et le menu servi, pour constituer le
--    « souvenir du menu » au fil des années.
-- ============================================================

-- ---------- family_members : l'arbre généalogique ----------

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text check (last_name is null or char_length(last_name) <= 60),
  /** Lien familial : « maman », « papi », « cousine Léa »… */
  family_role text check (family_role is null or char_length(family_role) <= 60),
  /** Chemin de la photo dans le bucket storage (dossier = family_id) */
  photo_url text,
  /** Rang/génération : 1 = les aînés, 2 = leurs enfants, etc. */
  generation integer not null default 1 check (generation between 1 and 10),
  /** Parent dans l'arbre (optionnel) */
  parent_id uuid references public.family_members (id) on delete set null,
  /** Membre de l'arbre lié à un compte Supabase (optionnel) */
  linked_profile_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists family_members_family_idx
  on public.family_members (family_id, generation);

alter table public.family_members enable row level security;

-- Toute la famille lit l'arbre
drop policy if exists "family_members_select_family" on public.family_members;
create policy "family_members_select_family"
  on public.family_members for select
  to authenticated
  using (public.is_family_member(family_id));

-- Tout membre connecté peut ajouter un membre à l'arbre
drop policy if exists "family_members_insert_family" on public.family_members;
create policy "family_members_insert_family"
  on public.family_members for insert
  to authenticated
  with check (
    public.is_family_member(family_id)
    and created_by = auth.uid()
  );

-- Tout membre peut modifier / supprimer (l'arbre se construit à plusieurs)
drop policy if exists "family_members_update_family" on public.family_members;
create policy "family_members_update_family"
  on public.family_members for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "family_members_delete_family" on public.family_members;
create policy "family_members_delete_family"
  on public.family_members for delete
  to authenticated
  using (public.is_family_member(family_id));

-- ---------- family_events : les repas de famille ----------

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  /** Date du repas (pas forcément exacte : un souvenir) */
  event_date date not null,
  note text check (note is null or char_length(note) <= 1000),
  /** Chemin de la photo de l'événement dans le bucket storage */
  photo_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Table de liaison : le menu servi à l'événement
create table if not exists public.event_recipes (
  event_id uuid not null references public.family_events (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  primary key (event_id, recipe_id)
);

create index if not exists family_events_family_idx
  on public.family_events (family_id, event_date desc);
create index if not exists event_recipes_event_idx
  on public.event_recipes (event_id);

alter table public.family_events enable row level security;
alter table public.event_recipes enable row level security;

drop policy if exists "family_events_select_family" on public.family_events;
create policy "family_events_select_family"
  on public.family_events for select
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "family_events_insert_family" on public.family_events;
create policy "family_events_insert_family"
  on public.family_events for insert
  to authenticated
  with check (
    public.is_family_member(family_id)
    and created_by = auth.uid()
  );

drop policy if exists "family_events_update_family" on public.family_events;
create policy "family_events_update_family"
  on public.family_events for update
  to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

drop policy if exists "family_events_delete_family" on public.family_events;
create policy "family_events_delete_family"
  on public.family_events for delete
  to authenticated
  using (public.is_family_member(family_id));

drop policy if exists "event_recipes_select_family" on public.event_recipes;
create policy "event_recipes_select_family"
  on public.event_recipes for select
  to authenticated
  using (
    exists (
      select 1 from public.family_events e
      where e.id = event_id and public.is_family_member(e.family_id)
    )
  );

drop policy if exists "event_recipes_insert_family" on public.event_recipes;
create policy "event_recipes_insert_family"
  on public.event_recipes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.family_events e
      where e.id = event_id and public.is_family_member(e.family_id)
    )
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_family_member(r.family_id)
    )
  );

drop policy if exists "event_recipes_delete_family" on public.event_recipes;
create policy "event_recipes_delete_family"
  on public.event_recipes for delete
  to authenticated
  using (
    exists (
      select 1 from public.family_events e
      where e.id = event_id and public.is_family_member(e.family_id)
    )
  );
