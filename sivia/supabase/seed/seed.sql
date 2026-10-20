-- ============================================================
-- Sivia — données de démonstration (optionnel)
-- À exécuter dans le SQL Editor APRÈS avoir créé votre compte,
-- votre famille et une première recette via l'application.
-- Remplacez les UUID ci-dessous par les vôtres.
-- ============================================================
-- Mon profil : <PROFILE_ID> = auth.uid()
-- Ma famille : <FAMILY_ID>

insert into public.recipes
  (family_id, author_id, title, category, servings, prep_time, cook_time,
   ingredients, steps, anecdote, origin_story)
values
  (
    '<FAMILY_ID>', '<PROFILE_ID>',
    'Blanquette de veau, comme chez Tata Suzanne',
    'plat', 6, 30, 90,
    array[
      '1,2 kg de veau (collier, tendron)',
      '3 carottes',
      '2 oignons piqués d''un clou de girofle',
      '200 g de champignons de Paris',
      '40 cl de crème fraîche',
      '30 g de farine',
      '1 citron, laurier, thym, sel'
    ],
    array[
      'Blanchir la viande 10 min, écumer soigneusement.',
      'Ajouter carottes, oignons, laurier et thym. Saler légèrement.',
      'Laisser mijoter 1 h 30 à couvert, à feu très doux.',
      'Faire revenir les champignons à part, à la poêle.',
      'Lier la sauce avec la crème hors du feu — toujours hors du feu.',
      'Ajouter un filet de citron. Servir avec du riz.'
    ],
    'La crème, toujours hors du feu — tata y tenait. Si elle tourne, on recommence, personne ne saura.',
    'Transmise par Tata Suzanne, dictée à Papa, puis notée par Léa un dimanche de pluie.'
  ),
  (
    '<FAMILY_ID>', '<PROFILE_ID>',
    'Tarte aux pommes de mamie Yvonne',
    'dessert', 8, 25, 40,
    array[
      '1 pâte brisée (maison, c''est mieux)',
      '6 pommes (Reinettes de préférence)',
      '80 g de sucre',
      '20 g de beurre',
      '1 sachet de sucre vanillé',
      '2 œufs + 10 cl de crème'
    ],
    array[
      'Étaler la pâte dans le moule, piquer le fond.',
      'Disposer les pommes coupées en lamelles, bien serrées.',
      'Mélanger œufs, crème, sucre et verser sur les pommes.',
      'Parsemer de sucre vanillé et de noisettes de beurre.',
      'Enfourner 40 min à 180 °C. Laisser tiédir avant de découper.'
    ],
    'Mamie disait : « une part tiède, c''est la moitié du bonheur ». Elle avait raison.',
    'La recette de mamie Yvonne, apprise de sa propre mère, transmise de génération en génération.'
  );
