-- ============================================================
-- Sivia Plus — un seul essai par famille, garanti côté serveur
--
-- Remplace guard_family_plan (migrations 0012 puis 0015) :
--  * essai de 2 semaines, dates fixées par le serveur ;
--  * NOUVEAU : l'essai n'est autorisé QUE si la famille n'a jamais
--    eu ni essai ni plan (plan = 'gratuit' et plan_source IS NULL).
--    Avant, un membre pouvait réouvrir l'essai après expiration
--    ('expire' -> 'essai' était permis) : essai à l'infini possible
--    en appelant l'API directement, même si l'interface bloquait.
--  * seul le service (webhook Stripe / back-office) active un plan payé.
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
  -- sauf l'ouverture de l'essai, UNE fois par famille.
  if new.plan is distinct from old.plan
     or new.plan_started_at is distinct from old.plan_started_at
     or new.plan_expires_at is distinct from old.plan_expires_at
     or new.plan_source is distinct from old.plan_source
  then
    if new.plan = 'essai'
       and old.plan = 'gratuit'
       and old.plan_source is null
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
      'Sivia Plus : un seul essai par famille, et l''activation payante passe par le paiement.';
  end if;

  return new;
end;
$$;

drop trigger if exists families_plan_guard on public.families;
create trigger families_plan_guard
  before update on public.families
  for each row execute function public.guard_family_plan();
