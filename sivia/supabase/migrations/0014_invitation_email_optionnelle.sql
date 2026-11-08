-- 0014 : une invitation n'exige plus d'adresse mail — le lien fait foi.
-- Le mail n'était de toute façon jamais envoyé : la colonne devient optionnelle,
-- et l'UI génère un simple lien d'invitation à partager.
alter table public.invitations alter column email drop not null;
