import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { usePageTitle } from '@/lib/usePageTitle'

/**
 * Pages juridiques publiques (LCEN + RGPD + code de la consommation).
 * Champs [à compléter] : à remplir par les informations de la structure
 * éditrice avant le lancement public.
 */

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  usePageTitle(title)
  return (
    <div className="min-h-dvh bg-papier">
      <header className="border-b border-encre-doux/20 bg-carte/95">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="text-sm font-bold text-encre-doux hover:text-tomate inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Retour à Sivia
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl font-bold text-encre mb-6">{title}</h1>
        <div className="space-y-6 text-[15px] leading-relaxed text-encre-doux">{children}</div>
        <hr className="filet-double my-8" />
        <p className="text-sm text-encre-doux/70 text-center">
          Sivia — le carnet de recettes de votre famille ·{' '}
          <Link to="/mentions-legales" className="underline hover:text-tomate">Mentions légales</Link> ·{' '}
          <Link to="/confidentialite" className="underline hover:text-tomate">Confidentialité</Link> ·{' '}
          <Link to="/conditions" className="underline hover:text-tomate">Conditions d'utilisation</Link>
        </p>
      </main>
    </div>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-serif text-2xl font-semibold text-encre !mt-8">{children}</h2>
}

/** Mentions légales (LCEN, art. 6-III de la loi pour la confiance dans l'économie numérique). */
export function MentionsLegalesPage() {
  return (
    <LegalShell title="Mentions légales">
      <H2>Éditeur du site</H2>
      <p>
        Le site Sivia (ci-après « le Service ») est édité par <strong>GTB&CO</strong>
        {' '}(Gaspar Truchon-Bartès), [adresse postale à compléter], immatriculée sous le numéro
        {' '}[SIRET / RCS à compléter].<br />
        Contact : [adresse e-mail de contact à compléter].
      </p>
      <H2>Directeur de la publication</H2>
      <p>Gaspar Truchon-Bartès, [adresse postale à compléter].</p>
      <H2>Hébergement</H2>
      <p>
        L'application est hébergée par <strong>Vercel Inc.</strong> (vercel.com) — 410 Terry
        Avenue North, Seattle, WA 98109, États-Unis — et par <strong>GitHub Pages</strong>
        {' '}(github.com, GitHub B.V.). Les données familiales (fiches, photos, messages) sont
        stockées par <strong>Supabase</strong> (supabase.com). Les paiements sont traités par
        {' '}<strong>Stripe</strong> (stripe.com) ; GTB&CO n'a jamais accès à tes données bancaires.
      </p>
      <H2>Propriété intellectuelle</H2>
      <p>
        Le nom « Sivia », le code du service, ses textes et son identité graphique sont la
        propriété de GTB&CO. Toute reproduction non autorisée est interdite. Les recettes,
        photos et souvenirs publiés par les familles leur appartiennent (voir les{' '}
        <Link to="/conditions" className="underline text-tomate hover:text-tomate">
          conditions d'utilisation
        </Link>
        ).
      </p>
    </LegalShell>
  )
}

/** Politique de confidentialité (RGPD, art. 12 et 13). */
export function ConfidentialitePage() {
  return (
    <LegalShell title="Confidentialité">
      <H2>Qui traite tes données ?</H2>
      <p>
        GTB&CO est responsable du traitement des données du Service. Contact pour toute question
        relative à tes données : [adresse e-mail de contact à compléter].
      </p>
      <H2>Quelles données, pourquoi, pour combien de temps ?</H2>
      <p>
        <strong>Compte</strong> : ton adresse e-mail, ton prénom, ta photo de profil et ton rôle
        dans la famille — pour créer et gérer ton compte (base légale : exécution du contrat),
        le temps de sa vie, puis effacés dans les 30 jours suivant la suppression du compte.
      </p>
      <p>
        <strong>Contenus familiaux</strong> : recettes, photos, messages et souvenirs que tu
        publies — pour faire vivre le carnet de ta famille (base légale : exécution du contrat).
      </p>
      <p>
        <strong>Facturation</strong> : les paiements Sivia Plus sont traités par Stripe ; les
        factures sont conservées 10 ans (base légale : obligation légale comptable).
      </p>
      <p>
        <strong>Sécurité</strong> : nous gardons des journaux techniques minimaux le temps
        nécessaire à la sécurité du service (base légale : intérêt légitime).
      </p>
      <H2>Ce que nous ne faisons pas</H2>
      <p>
        Aucune donnée n'est vendue, louée ou partagée avec des annonceurs. Aucun traceur
        publicitaire ni mesure d'audience tiers n'est présent dans le service. Tes données
        familiales ne sont lisibles que par les membres invités de ta famille : c'est garanti
        par le cloisonnement des comptes (Row Level Security) côté serveur.
      </p>
      <H2>Tes droits</H2>
      <p>
        Tu peux accéder à tes données et les corriger depuis ton profil, les exporter (droit à
        la portabilité, bouton « Exporter mes données »), demander leur effacement complet
        (droit à l'effacement, bouton « Supprimer mon compte »), ou t'opposer à un traitement.
        Nous répondons sous 1 mois. Si besoin, tu peux saisir la CNIL (cnil.fr).
      </p>
      <H2>Les enfants</H2>
      <p>
        En France, la majorité numérique est fixée à 15 ans : avant cet âge, l'accord d'un
        parent est requis pour créer un compte. Chacun est responsable des photos qu'il
        publie, y compris du droit à l'image des enfants de la famille.
      </p>
      <H2>Hors Union européenne</H2>
      <p>
        Vercel, Supabase et Stripe peuvent traiter certaines données hors Union européenne ;
        ces transferts sont encadrés par les garanties appropriées prévues par le RGPD
        (clauses contractuelles types).
      </p>
    </LegalShell>
  )
}

/** Conditions générales d'utilisation (comptes, contenus, Sivia Plus, rétractation). */
export function ConditionsPage() {
  return (
    <LegalShell title="Conditions d'utilisation">
      <H2>Le service</H2>
      <p>
        Sivia est le carnet de recettes d'une famille : chacune y conserve ses recettes, ses
        photos et ses souvenirs, dans un cercle privé accessible uniquement sur invitation.
      </p>
      <H2>Ton compte</H2>
      <p>
        Tu dois fournir des informations exactes, garder ton mot de passe secret et avoir
        15 ans révolus, ou l'accord d'un parent si tu es mineur. Un compte est nominatif :
        ne le prête pas.
      </p>
      <H2>Ce que tu publies</H2>
      <p>
        Tu restes propriétaire de tes recettes, photos et messages. En publiant un contenu,
        tu garantis en avoir les droits, notamment le droit à l'image des personnes
        photographiées (enfants compris : l'accord des titulaires de l'autorité parentale est
        requis). Tu accordes à Sivia la licence minimale nécessaire pour l'héberger et le
        présenter à ta famille, y compris dans le livre de famille exportable. Tu peux
        retirer un contenu à tout moment ; le retirer le retire pour toute la famille.
      </p>
      <H2>Sivia Plus</H2>
      <p>
        Le service de base est gratuit. Sivia Plus (impression du livre, PDF sans filigrane)
        est proposé aux prix affichés TTC sur la page de paiement, en mensuel ou annuel, avec
        un essai gratuit de 14 jours. Tu peux arrêter ton abonnement à tout moment ; il reste
        actif jusqu'à la fin de la période payée.
      </p>
      <H2>Droit de rétractation</H2>
      <p>
        Conformément au code de la consommation, tu disposes de 14 jours pour te rétracter
        après un paiement. Attention : si tu demandes expressément un accès immédiat au
        service payant, tu reconnais, conformément à l'article L221-28 du code de la
        consommation, renoncer à ton droit de rétractation une fois le contenu délivré.
        Pour toute question ou remboursement : [adresse e-mail de contact à compléter].
      </p>
      <H2>Responsabilité</H2>
      <p>
        Le service est fourni « en l'état » ; GTB&CO met tout en œuvre pour sa disponibilité
        et la sécurité de tes données, sans garantie de fonctionnement ininterrompu. Les
        sauvegardes sont best-effort : garde une copie de tes recettes les plus précieuses.
      </p>
      <H2>Évolution du service</H2>
      <p>
        Ces conditions peuvent évoluer ; toute modification substantielle sera annoncée dans
        l'application. Le droit français s'applique.
      </p>
    </LegalShell>
  )
}
