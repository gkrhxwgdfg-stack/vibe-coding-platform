-- ============================================================
-- Sivia — planche familiale : photos + commentaires sans recette
-- (migration 0007)
--
-- Jusqu'ici, un commentaire (photo comprise) devait obligatoirement
-- être rattaché à une recette. La planche familiale de l'accueil
-- publie des « moments de cuisine » libres : un commentaire avec
-- photo, rattaché à la famille, sans recette.
-- ============================================================

-- recipe_id devient nullable : null = moment de la planche familiale
alter table public.recipe_comments
  alter column recipe_id drop not null;

-- Un commentaire « planche » est rattaché directement à la famille
alter table public.recipe_comments
  add column if not exists family_id uuid references public.families (id) on delete cascade;

-- Cohérence : tout commentaire a une recette OU une famille
alter table public.recipe_comments
  drop constraint if exists recipe_comments_has_target;
alter table public.recipe_comments
  add constraint recipe_comments_has_target
  check (recipe_id is not null or family_id is not null);

-- La famille du commentaire « planche » est déduite automatiquement à l'insert
create or replace function public.recipe_comments_set_family_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.family_id is null then
    if new.recipe_id is not null then
      select family_id into new.family_id from public.recipes where id = new.recipe_id;
    else
      select family_id into new.family_id from public.profiles where id = new.author_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists recipe_comments_family_id_trigger on public.recipe_comments;
create trigger recipe_comments_family_id_trigger
  before insert on public.recipe_comments
  for each row execute function public.recipe_comments_set_family_id();

create index if not exists recipe_comments_family_idx
  on public.recipe_comments (family_id, created_at);

-- ---------- RLS : mise à jour des policies ----------

-- Lecture : membres de la famille du commentaire (via la recette ou directement)
drop policy if exists "recipe_comments_select_family" on public.recipe_comments;
create policy "recipe_comments_select_family"
  on public.recipe_comments for select
  to authenticated
  using (
    public.is_family_member(
      coalesce(
        family_id,
        (select r.family_id from public.recipes r where r.id = recipe_id)
      )
    )
  );

-- Insert : membre de la famille, sur une recette de sa famille
-- ou en tant que moment de planche (family_id = sa famille)
drop policy if exists "recipe_comments_insert_family" on public.recipe_comments;
create policy "recipe_comments_insert_family"
  on public.recipe_comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (
      (recipe_id is not null and exists (
        select 1 from public.recipes r
        where r.id = recipe_id and public.is_family_member(r.family_id)
      ))
      or
      (recipe_id is null and public.is_family_member(family_id))
    )
  );
