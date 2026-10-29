import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Heart, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useRecipes } from '@/hooks/useRecipes'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Stamp } from '@/components/ui/Stamp'
import { TextInput, TextArea } from '@/components/ui/FormFields'
import { ReadingSizePicker } from '@/components/ui/ReadingSizePicker'
import { formatDate } from '@/lib/format'
import { Sparkle } from '@/components/motifs/Sparkle'

const NO_FILTERS = { query: '', category: 'toutes' as const, authorId: 'tous' as const }

export function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { recipes } = useRecipes(NO_FILTERS)

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [familyRole, setFamilyRole] = useState(profile?.family_role ?? '')
  const memberSince = profile?.created_at
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!profile) return null
  const profileId = profile.id

  const myRecipes = recipes.filter((r) => r.author_id === profileId)
  const myFavorites = recipes.filter((r) => r.is_favorite)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        family_role: familyRole.trim() || null,
      })
      .eq('id', profileId)
    setSaving(false)
    if (updateError) {
      setError('Impossible d’enregistrer pour le moment. Réessaie ?')
      return
    }
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/connexion', { replace: true })
  }

  return (
    <div className="space-y-8">
      {/* Profil : avatar en polaroïd à épingle + tamis léger (§8) */}
      <section aria-labelledby="profile-title" className="text-center">
        <figure className="polaroid relative inline-block w-[150px] [-r:-2deg]">
          <span className="epingle" aria-hidden="true" />
          <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" className="mx-auto w-full aspect-square text-4xl" />
          <figcaption className="font-serif italic text-[11.5px] text-cannelle pt-1.5">
            {profile.family_role || 'de la famille'}
          </figcaption>
        </figure>
        <h1 id="profile-title" className="font-serif text-3xl font-semibold mt-4">{profile.display_name}</h1>
        <div className="flex justify-center my-3">
          <Stamp name={profile.display_name} />
        </div>
        <p className="text-sm font-bold text-encre-doux mt-1">En cuisine depuis {formatDate(memberSince)}</p>
      </section>

      {/* Mes recettes / favoris */}
      <section aria-label="Mes recettes et favoris">
        <div className="grid grid-cols-2 gap-4">
          <Link to="/recettes" className="card-surface card-pad p-5 text-center hover:shadow-soft transition-shadow">
            <BookOpen size={28} className="mx-auto text-vert mb-2" aria-hidden="true" />
            <span className="font-serif text-3xl font-bold block">{myRecipes.length}</span>
            <span className="text-encre-doux">recette{myRecipes.length > 1 ? 's' : ''} écrites</span>
          </Link>
          <Link to="/favoris" className="card-surface card-pad p-5 text-center hover:shadow-soft transition-shadow">
            <Heart size={28} className="mx-auto text-tomate mb-2" aria-hidden="true" />
            <span className="font-serif text-3xl font-bold block">{myFavorites.length}</span>
            <span className="text-encre-doux">favori{myFavorites.length > 1 ? 's' : ''}</span>
          </Link>
        </div>
      </section>

      {/* Mon profil */}
      <section aria-labelledby="edit-profile-title">
        <Card>
          <CardHeader kicker="Mon profil" title="Ce que la famille voit de toi" />
          <form onSubmit={handleSave} noValidate className="space-y-4">
            <TextInput
              label="Ton prénom"
              htmlFor="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <TextArea
              label="Un mot sur toi"
              htmlFor="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="« Celle qui garde les secrets de la sauce. »"
            />
            <TextInput
              label="Ton lien dans la famille"
              htmlFor="familyRole"
              value={familyRole}
              onChange={(e) => setFamilyRole(e.target.value)}
              placeholder="maman, papi, cousine Léa…"
              hint="C’est ainsi que la famille te reconnaîtra en cuisine."
            />
            <div>
              <span className="block font-bold text-encre mb-1.5">Ton tampon d’authenticité</span>
              <Stamp name={displayName.trim() || profile.display_name} className="scale-90" />
              <p className="text-sm text-encre-doux mt-2">
                Il est apposé sur tes recettes : « de la part de {displayName.trim() || profile.display_name} ».
              </p>
            </div>
            {error && <p className="text-tomate font-bold" role="alert">{error}</p>}
            {saved && (
              <p className="text-vert font-bold inline-flex items-center gap-1.5">
                <Sparkle /> C’est noté !
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={saving || !displayName.trim()}>
              {saving ? 'On enregistre…' : 'Enfourner mon profil'}
            </Button>
          </form>
        </Card>
      </section>

      {/* Paramètres */}
      <section aria-labelledby="settings-title">
        <Card>
          <CardHeader kicker="Paramètres" title="Ta cuisine à toi" />
          <div className="mb-6">
            <ReadingSizePicker hint="Plus gros, c’est plus confortable pour lire les recettes." />
          </div>
          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-4 py-2">
              <span>
                <strong>Notifications</strong>
                <span className="block text-sm text-encre-doux">Les derniers commentaires et photos de la famille, sur l’accueil</span>
              </span>
              <Link to="/" className="text-sm text-tomate font-bold hover:underline">Voir</Link>
            </li>
            <li className="flex items-center justify-between gap-4 py-2">
              <span>
                <strong>Confidentialité</strong>
                <span className="block text-sm text-encre-doux">Tes données restent dans le cercle familial (RLS Supabase)</span>
              </span>
            </li>
          </ul>
          <Button variant="danger" size="lg" className="w-full mt-4" onClick={handleSignOut}>
            <LogOut size={18} aria-hidden="true" /> Se déconnecter
          </Button>
        </Card>
      </section>
    </div>
  )
}
