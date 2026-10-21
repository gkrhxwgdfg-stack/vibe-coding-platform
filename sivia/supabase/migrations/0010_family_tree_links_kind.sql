-- ============================================================
-- Sivia — arbre généalogique : liens typés parent / conjoint
-- (migration 0010)
--
-- L'arbre se construit désormais à partir des liens entre personnes,
-- comme un vrai arbre généalogique :
-- - lien de parenté (« fils de », « fille de ») : branche descendante
-- - lien de couple (« conjoint de », « marié à ») : branche horizontale
--
-- family_members.link_kind distingue les deux : le parent_id reste le
-- « référent » du lien (le parent, ou le conjoint).
-- ============================================================

alter table public.family_members
  add column if not exists link_kind text
  check (link_kind in ('parent', 'partner'))
  default 'parent';

-- Peupler depuis les libellés existants (issus de la v1 de l'arbre)
update public.family_members
set link_kind = 'partner'
where relation_label in ('conjoint', 'conjointe', 'marié', 'mariée', 'marie', 'mariee');
