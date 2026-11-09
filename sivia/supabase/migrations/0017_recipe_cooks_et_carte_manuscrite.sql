-- ============================================================================
-- Sivia — 0017 : « Je l'ai faite ! » + carte manuscrite
--
-- (1) table recipe_cooks : qui a refait la recette, et quand. Un petit bout
--     de l'histoire de chaque plat — l'écrite par X, refaite par Y et Z :
--     la généalogie de la recette.
-- (2) recettes.card_url : la photo de la carte manuscrite originale (le
--     papier taché de farine de Mamie), facultative.
--
-- À APPLIQUER MANUELLEMENT dans le SQL Editor Supabase (comme 0001-0016).
-- ============================================================================

-- (1) « Je l'ai faite ! » ----------------------------------------------------

create table if not exists public.recipe_cooks (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  cooked_at timestamptz not null default now(),
  constraint recipe_cooks_unique unique (recipe_id, user_id)
);

alter table public.recipe_cooks enable row level security;

-- La famille voit qui a refait la recette
drop policy if exists "recipe_cooks_select_family" on public.recipe_cooks;
create policy "recipe_cooks_select_family"
  on public.recipe_cooks for select
  to authenticated
  using (
    public.is_family_member(
      (select family_id from public.recipes where id = recipe_id)
    )
  );

-- Un membre marque « Je l'ai faite ! » pour lui-même uniquement
drop policy if exists "recipe_cooks_insert_self" on public.recipe_cooks;
create policy "recipe_cooks_insert_self"
  on public.recipe_cooks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_family_member(
      (select family_id from public.recipes where id = recipe_id)
    )
  );

-- …et peut se rétracter (son propre marqueur uniquement)
drop policy if exists "recipe_cooks_delete_self" on public.recipe_cooks;
create policy "recipe_cooks_delete_self"
  on public.recipe_cooks for delete
  to authenticated
  using (auth.uid() = user_id);

-- (2) Carte manuscrite --------------------------------------------------------

alter table public.recipes add column if not exists card_url text;
