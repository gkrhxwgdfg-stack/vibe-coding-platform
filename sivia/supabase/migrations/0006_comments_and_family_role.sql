-- ============================================================
-- Sivia — commentaires & photos sur les recettes + lien familial
-- (migration 0006)
--
-- Permet à la famille de faire vivre les recettes : commenter,
-- ajouter des photos de leurs réalisations, et de préciser le
-- lien familial de chaque membre (maman, papi, cousine…).
-- ============================================================

-- ---------- recipe_comments : le fil de vie d'une recette ----------

create table if not exists public.recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  /** Texte du commentaire (peut \u00eatre vide si une photo est jointe) */
  body text check (body is null or char_length(body) between 1 and 2000),
  /** Chemin dans le bucket storage (dossier = family_id), null si texte seul */
  photo_url text,
  /** Un commentaire, c'est un mot, une photo, ou les deux */
  constraint recipe_comments_has_content
    check (body is not null or photo_url is not null),
  created_at timestamptz not null default now()
);

create index if not exists recipe_comments_recipe_idx
  on public.recipe_comments (recipe_id, created_at);

alter table public.recipe_comments enable row level security;

-- Les membres de la famille voient les commentaires de leurs recettes
drop policy if exists "recipe_comments_select_family" on public.recipe_comments;
create policy "recipe_comments_select_family"
  on public.recipe_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_family_member(r.family_id)
    )
  );

-- Un membre de la famille commente sur une recette de sa famille
drop policy if exists "recipe_comments_insert_family" on public.recipe_comments;
create policy "recipe_comments_insert_family"
  on public.recipe_comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_family_member(r.family_id)
    )
  );

-- Seul l'auteur peut modifier ou supprimer son commentaire
drop policy if exists "recipe_comments_update_author" on public.recipe_comments;
create policy "recipe_comments_update_author"
  on public.recipe_comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "recipe_comments_delete_author" on public.recipe_comments;
create policy "recipe_comments_delete_author"
  on public.recipe_comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- ---------- profiles.family_role : le lien familial ----------
-- Ex : « maman », « papi », « cousine Léa », « belle-sœur ».
-- Champ libre, renseigné par le membre lui-même.

alter table public.profiles
  add column if not exists family_role text;
