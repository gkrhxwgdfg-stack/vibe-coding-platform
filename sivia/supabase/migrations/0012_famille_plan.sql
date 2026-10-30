-- ============================================================
-- Sivia — Phase 1 monétisation : « Sivia Famille » (par groupe)
--
-- Règles (spécification « Architecture monétisation ») :
--  * l'abonnement s'attache à la FAMILLE, jamais à une personne ;
--  * un seul paieur par groupe ; les contributeurs ne voient jamais de prix ;
--  * l'essai d'un mois est ouvert sans carte bancaire ;
--  * l'activation payante ('actif') passe uniquement par le service
--    (webhook Stripe / back-office), JAMAIS par un membre depuis l'app ;
--  * expiration ≠ effacement : le groupe retombe en 'gratuit'/'expire'
--    et tout son contenu reste visible (rien ne se supprime jamais).
-- ============================================================

-- ---------- État du plan sur la famille ----------

alter table public.families
  add column if not exists plan text not null default 'gratuit'
    check (plan in ('gratuit', 'essai', 'actif', 'expire'));

alter table public.families
  add column if not exists plan_started_at timestamptz;

alter table public.families
  add column if not exists plan_expires_at timestamptz;

-- Comment la famille a obtenu son plan : 'essai' | 'paiement' | 'cadeau'
alter table public.families
  add column if not exists plan_source text
    check (plan_source is null or plan_source in ('essai', 'paiement', 'cadeau'));

-- ---------- Garde-fou : seul le service active un plan payé ----------

-- Les membres (authenticated) peuvent ouvrir l'essai (gratuit/expire → essai,
-- 1 mois, dates fixées par le serveur). Tout autre changement de plan ou de
-- date de plan depuis l'app est refusé : l'activation payée vient du webhook
-- Stripe (service_role), pas du client.
create or replace function public.guard_family_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text := 'service_role';
begin
  -- Qui appelle ? (le SQL Editor / la CLI n'ont pas de JWT client)
  begin
    caller_role := coalesce(auth.jwt() ->> 'role', 'service_role');
  exception when others then
    caller_role := 'service_role';
  end;

  -- Webhook / back-office : autorisé
  if caller_role in ('service_role', 'supabase_admin') then
    return new;
  end if;

  -- Membre connecté : les colonnes du plan ne se touchent pas,
  -- sauf l'ouverture de l'essai (gratuit ou expire → essai).
  if new.plan is distinct from old.plan
     or new.plan_started_at is distinct from old.plan_started_at
     or new.plan_expires_at is distinct from old.plan_expires_at
     or new.plan_source is distinct from old.plan_source
  then
    if new.plan = 'essai' and old.plan in ('gratuit', 'expire')
       and new.plan_started_at is not distinct from old.plan_started_at
       and new.plan_expires_at is not distinct from old.plan_expires_at
       and new.plan_source is not distinct from old.plan_source
    then
      -- Essai d'un mois, sans carte : le serveur fixe les dates, pas le client
      new.plan_started_at := now();
      new.plan_expires_at := now() + interval '1 month';
      new.plan_source := 'essai';
      return new;
    end if;
    raise exception
      'Sivia Famille : l''activation payante passe par le paiement, pas par l''application.';
  end if;

  return new;
end;
$$;

drop trigger if exists families_plan_guard on public.families;
create trigger families_plan_guard
  before update on public.families
  for each row execute function public.guard_family_plan();

-- ---------- Liste d'attente : intentions avant l'ouverture des paiements ----------

-- Une ligne par famille (unique) : le premier membre inscrit sa famille ;
-- ça mesure le désir réel avant de bâtir Stripe (séquence Phase 1 §4).
create table if not exists public.family_waitlist (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (family_id)
);

alter table public.family_waitlist enable row level security;

-- Les membres de la famille voient leur inscription
create policy "waitlist_select_family"
  on public.family_waitlist for select
  to authenticated
  using (public.is_family_member(family_id));

-- N'importe quel membre peut inscrire sa famille (le payeur n'est pas connu)
create policy "waitlist_insert_member"
  on public.family_waitlist for insert
  to authenticated
  with check (public.is_family_member(family_id) and auth.uid() = created_by);

create index if not exists family_waitlist_family_idx on public.family_waitlist (family_id);
