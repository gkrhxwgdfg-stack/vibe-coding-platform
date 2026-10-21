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
import { formatDate } from '@/lib/format'

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
      <section aria-labelledby="profile-title" className="text-center">
        <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" className="mx-auto w-24 h-24 text-4xl" />
        <h1 id="profile-title" className="text-3xl font-bold mt-3">{profile.display_name}</h1>
        <div className="flex justify-center my-3">
          <Stamp name={profile.display_name} />
        </div>
        {profile.family_role && (
          <p className="text-hand text-bleu text-2xl">{profile.family_role}</p>
        )}
        <p className="text-sm text-encre-soft mt-1">À table depuis {formatDate(memberSince)}</p>
      </section>

      {/* Mes recettes / favoris */}
      <section aria-label="Mes recettes et favoris">
        <div className="grid grid-cols-2 gap-4">
          <Link to="/recettes" className="card-surface p-5 text-center hover:shadow-soft transition-shadow">
            <BookOpen size={28} className="mx-auto text-terra mb-2" aria-hidden="true" />
            <span className="font-serif text-3xl font-bold block">{myRecipes.length}</span>
            <span className="text-encre-soft">recette{myRecipes.length > 1 ? 's' : ''} écrites</span>
          </Link>
          <Link to="/favoris" className="card-surface p-5 text-center hover:shadow-soft transition-shadow">
            <Heart size={28} className="mx-auto text-carmine mb-2" aria-hidden="true" />
            <span className="font-serif text-3xl font-bold block">{myFavorites.length}</span>
            <span className="text-encre-soft">favori{myFavorites.length > 1 ? 's' : ''}</span>
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
              hint="C’est ainsi que la famille te reconnaîtra à table."
            />
            <div>
              <span className="block font-bold text-encre mb-1.5">Ton tampon d’authenticité</span>
              <Stamp name={displayName.trim() || profile.display_name} className="scale-90" />
              <p className="text-sm text-encre-soft mt-2">
                Il est apposé sur tes recettes : « de la part de {displayName.trim() || profile.display_name} ».
              </p>
            </div>
            {error && <p className="text-carmine font-bold" role="alert">{error}</p>}
            {saved && <p className="text-sauge font-bold">C’est noté !</p>}
            <Button type="submit" size="lg" className="w-full" disabled={saving || !displayName.trim()}>
              {saving ? 'On enregistre…' : 'Enregistrer mon profil'}
            </Button>
          </form>
        </Card>
      </section>

      {/* Paramètres */}
      <section aria-labelledby="settings-title">
        <Card>
          <CardHeader kicker="Paramètres" title="Ta cuisine à toi" />
          <ul className="space-y-2">
            <li className="flex items-center justify-between gap-4 py-2">
              <span>
                <strong>Notifications</strong>
                <span className="block text-sm text-encre-soft">Les derniers commentaires et photos de la famille, sur l’accueil</span>
              </span>
              <Link to="/" className="text-sm text-terra font-bold hover:underline">Voir</Link>
            </li>
            <li className="flex items-center justify-between gap-4 py-2">
              <span>
                <strong>Confidentialité</strong>
                <span className="block text-sm text-encre-soft">Tes données restent dans le cercle familial (RLS Supabase)</span>
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
