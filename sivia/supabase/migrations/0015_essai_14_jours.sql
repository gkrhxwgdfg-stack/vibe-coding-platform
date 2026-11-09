-- ============================================================
-- Sivia Plus — essai sans carte réduit à 2 semaines (au lieu d'1 mois)
--
-- Remplace la fonction guard_family_plan (migration 0012) :
--  * seul le service (webhook Stripe / back-office) active un plan payé ;
--  * les membres peuvent uniquement ouvrir l'essai, désormais de
--    2 SEMAINES, dates toujours fixées par le serveur.
-- Idempotent : recrée le trigger sur la nouvelle fonction.
-- ============================================================

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
      -- Essai de 2 semaines, sans carte : le serveur fixe les dates
      new.plan_started_at := now();
      new.plan_expires_at := now() + interval '14 days';
      new.plan_source := 'essai';
      return new;
    end if;
    raise exception
      'Sivia Plus : l''activation payante passe par le paiement, pas par l''application.';
  end if;

  return new;
end;
$$;

drop trigger if exists families_plan_guard on public.families;
create trigger families_plan_guard
  before update on public.families
  for each row execute function public.guard_family_plan();
