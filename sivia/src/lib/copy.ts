/**
 * Charte éditoriale Savia (dossier de raffinement v2, section 2.3).
 * Ton de voix : tutoiement, phrases courtes, verbes de cuisine.
 * Toute microcopie de l'application passe par ici — aucun texte brut
 * dans les vues. Les messages d'erreur rassurent toujours et proposent
 * une sortie.
 */

export const COPY = {
  /** Verbes de cuisine pour les actions principales */
  actions: {
    /** Valider / enregistrer */
    enfourner: 'Enfourner',
    /** Publier une recette dans le carnet */
    partager: 'Partager à la famille',
    /** Laisser en brouillon */
    garderAuChaud: 'Garder au chaud',
    /** Rafraîchir une liste */
    remuer: 'Remuer le carnet',
    /** Aperçu */
    onGoute: 'On goûte',
    /** Supprimer, avec confirmation douce */
    retirer: 'Retirer du carnet',
    /** Fermer */
    ranger: 'Ranger',
  },

  /** Navigation : libellés classiques, rassurants pour les aînés */
  nav: {
    seConnecter: 'Se connecter',
    sInscrire: "S'inscrire",
    retourCarnet: 'Retour au carnet',
  },

  /** États de chargement — « On sort le carnet... » */
  loading: {
    carnet: 'On sort le carnet...',
    planche: 'On décore la planche...',
    recette: 'On ouvre la recette...',
    favoris: 'On rassemble tes préférées...',
    famille: 'On rassemble la famille...',
    cuisson: 'On attache le tablier...',
    messages: 'On rassemble les messages de la famille...',
    souvenirs: 'On déroule les souvenirs...',
    lien: 'On vérifie le lien...',
    profil: 'On retrouve ton profil...',
    recherche: 'On farfouille dans le carnet...',
    ecriture: 'On écrit dans le carnet...',
    tablier: 'On prépare le poste de cuisine...',
  },

  /** États vides — une phrase d'invitation et une action unique */
  empty: {
    favoris: 'Les chouchous du carnet attendent.',
    planche: 'Le carnet attend sa première photo.',
    recherche: 'Rien à cette page-ci. On tourne la page ?',
    recetteIntrouvable: 'Cette recette a dû sortir du four.',
    etapes: 'Pas encore d’étapes à suivre en cuisine.',
  },

  /** Erreurs — message doux + sortie, jamais de texte technique brut */
  errors: {
    reseau: 'La sauce a raté. On recommence ?',
    generique: 'Quelque chose a cloché. On réessaie ?',
    connexion: 'On ne reconnaît pas cette adresse ou ce mot de passe. Essaie encore ?',
    introuvable: 'On ne trouve pas ce que tu cherches.',
    session: 'Reconnecte-toi pour continuer.',
    reessayer: 'Réessayer',
  },
} as const

/**
 * Transforme un message d'erreur technique brut (Supabase, réseau…) en
 * message Savia rassurant. Le détail technique reste en console.
 */
export function friendlyError(raw: string | null | undefined): string {
  if (!raw) return COPY.errors.generique
  const known = raw.toLowerCase()
  if (
    known.includes('failed to fetch') ||
    known.includes('network') ||
    known.includes('fetch') ||
    known.includes('offline') ||
    known.includes('timeout')
  ) {
    return COPY.errors.reseau
  }
  if (known.includes('jwt') || known.includes('auth') || known.includes('session')) {
    return COPY.errors.session
  }
  return COPY.errors.generique
}
