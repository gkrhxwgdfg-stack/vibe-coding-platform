-- ============================================================
-- Savia — schéma initial
-- Principe fondamental : chaque groupe familial ne peut lire
-- et écrire que ses propres données (Row Level Security).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  stamp_emoji text not null default '🍳',
  family_id uuid references public.families (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null default 'autre'
    check (category in ('entree', 'plat', 'dessert', 'fete', 'saison', 'autre')),
  servings integer not null default 4 check (servings > 0),
  prep_time integer check (prep_time is null or prep_time >= 0),
  cook_time integer check (cook_time is null or cook_time >= 0),
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  anecdote text,
  origin_story text,
  photo_url text,
  is_sealed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- ---------- Index ----------

create index if not exists recipes_family_idx on public.recipes (family_id, created_at desc);
create index if not exists recipes_category_idx on public.recipes (family_id, category);
create index if not exists profiles_family_idx on public.profiles (family_id);
create index if not exists invitations_family_idx on public.invitations (family_id, status);
create index if not exists invitations_token_idx on public.invitations (token) where status = 'pending';

-- ---------- updated_at automatique ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_updated_at on public.recipes;
create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ---------- Profil automatique à l'inscription ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.recipes enable row level security;
alter table public.favorites enable row level security;

-- Helper : la famille de l'utilisateur courant (contourne la RLS de profiles)
create or replace function public.current_user_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

-- Helper : est-ce que l'utilisateur est membre de la famille ?
create or replace function public.is_family_member(fam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and family_id = fam_id
  );
$$;

-- ---------- families ----------

-- Tout membre peut voir sa famille
create policy "families_select_member"
  on public.families for select
  using (public.is_family_member(id));

-- N'importe quel utilisateur connecté peut créer une famille
create policy "families_insert_authenticated"
  on public.families for insert
  with check (auth.uid() = created_by);

-- Seuls les membres peuvent renommer la famille
create policy "families_update_member"
  on public.families for update
  using (public.is_family_member(id));

-- ---------- profiles ----------

-- On voit son profil + celui des membres de sa famille
create policy "profiles_select"
  on public.profiles for select
  using (id = auth.uid() or public.is_family_member(family_id));

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid());

-- ---------- invitations ----------

-- Les membres de la famille voient et gèrent ses invitations
create policy "invitations_select_member"
  on public.invitations for select
  using (public.is_family_member(family_id));

create policy "invitations_insert_member"
  on public.invitations for insert
  with check (public.is_family_member(family_id));

create policy "invitations_update_member"
  on public.invitations for update
  using (public.is_family_member(family_id));

create policy "invitations_delete_member"
  on public.invitations for delete
  using (public.is_family_member(family_id));

-- Accès public par token : nécessaire pour accepter une invitation
-- (le lien d'invitation contient le token, pas d'authentification requise)
create policy "invitations_select_by_token"
  on public.invitations for select
  using (status = 'pending' and expires_at > now());

-- ---------- recipes ----------

-- On ne voit que les recettes de sa famille
create policy "recipes_select_family"
  on public.recipes for select
  using (public.is_family_member(family_id));

create policy "recipes_insert_family"
  on public.recipes for insert
  with check (public.is_family_member(family_id) and auth.uid() = author_id);

-- Modification : membres de la famille, sauf si la recette est scellée
-- (une recette scellée n'est modifiable que par son créateur)
create policy "recipes_update_family"
  on public.recipes for update
  using (
    public.is_family_member(family_id)
    and (not is_sealed or auth.uid() = author_id)
  );

create policy "recipes_delete_author"
  on public.recipes for delete
  using (auth.uid() = author_id and public.is_family_member(family_id));

-- ---------- favorites ----------

-- Chacun gère ses propres favoris, uniquement sur les recettes de sa famille
create policy "favorites_select_self"
  on public.favorites for select
  using (user_id = auth.uid());

create policy "favorites_insert_self"
  on public.favorites for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and public.is_family_member(r.family_id)
    )
  );

create policy "favorites_delete_self"
  on public.favorites for delete
  using (user_id = auth.uid());

-- ---------- Storage : bucket recipe-photos ----------

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- Lecture publique des photos (le lien familial est le garde-fou)
create policy "photos_read_public"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

-- Upload : membres d'une famille, dans un dossier nommé par leur family_id
create policy "photos_upload_family"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );

-- Suppression : auteur de la recette ou membre de la famille du dossier
create policy "photos_delete_family"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-photos'
    and public.is_family_member((storage.foldername(name))[1]::uuid)
  );
