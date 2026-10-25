import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, Send, Trash2, X } from 'lucide-react'
import { familyPhotoUrl } from '@/services/familyTree'
import { type FamilyGeneration, type FamilyMember } from '@/lib/types'
import { useFamilyMembers } from '@/hooks/useFamily'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils'

interface FamilyMemberModalProps {
  open: boolean
  onClose: () => void
  /** Membre en cours d'édition (null = création) */
  member?: FamilyMember | null
  generations: FamilyGeneration[]
  /** Tous les membres de l'arbre (pour choisir le(s) référent(s)) */
  treeMembers: FamilyMember[]
  /** Pré-remplissage à la création via un « + » : premier référent */
  prefillParentId?: string | null
  /** Pré-remplissage : second référent (« relié aux deux ») */
  prefillParent2Id?: string | null
  /** Pré-remplissage : type de lien (scotch latéral = partenaire) */
  prefillLinkKind?: 'parent' | 'partner' | null
  onCreate: (values: {
    first_name: string
    last_name: string
    family_role: string
    generation_id: string | null
    parent_id: string | null
    parent2_id: string | null
    link_kind: 'parent' | 'partner' | null
    relation_label: string | null
    linked_profile_id: string | null
    photoFile: File | null
  }) => Promise<{ error: string | null }>
  onUpdate: (
    memberId: string,
    values: {
      first_name: string
      last_name: string
      family_role: string
      generation_id: string | null
      parent_id: string | null
      parent2_id: string | null
      link_kind: 'parent' | 'partner' | null
      relation_label: string | null
      linked_profile_id: string | null
      photoFile: File | null
      removePhoto?: boolean
    },
  ) => Promise<{ error: string | null }>
}

/**
 * Modal d'ajout / édition d'un membre de l'arbre — version simplifiée.
 *
 * Un seul bloc « Relié à … » : une personne, ou deux (« et aussi »).
 * Le lien s'écrit librement. À la création via un « + », le référent est
 * pré-rempli selon l'emplacement du « + » cliqué.
 */
export function FamilyMemberModal({
  open,
  onClose,
  member,
  generations,
  treeMembers,
  prefillParentId = null,
  prefillParent2Id = null,
  prefillLinkKind = null,
  onCreate,
  onUpdate,
}: FamilyMemberModalProps) {
  const { members: profiles } = useFamilyMembers()
  const isEditing = !!member

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [familyRole, setFamilyRole] = useState('')
  const [generationId, setGenerationId] = useState('')
  const [parentId, setParentId] = useState('')
  const [parent2Id, setParent2Id] = useState('')
  const [linkKind, setLinkKind] = useState<'parent' | 'partner'>('parent')
  const [relationLabel, setRelationLabel] = useState('')
  const [linkedProfileId, setLinkedProfileId] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFirstName(member?.first_name ?? '')
    setLastName(member?.last_name ?? '')
    setFamilyRole(member?.family_role ?? '')
    setGenerationId(member?.generation_id ?? '')
    setParentId(member?.parent_id ?? prefillParentId ?? '')
    setParent2Id(member?.parent2_id ?? prefillParent2Id ?? '')
    // Type de lien : édition = link_kind en base ; création = pré-remplissage
    // (scotch latéral = partenaire) ou déduit de l'existant, défaut 'parent'
    setLinkKind(
      member
        ? member.link_kind === 'partner'
          ? 'partner'
          : 'parent'
        : prefillLinkKind === 'partner'
          ? 'partner'
          : 'parent',
    )
    setRelationLabel(member?.relation_label ?? '')
    setLinkedProfileId(member?.linked_profile_id ?? '')
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(false)
    setError(null)
  }, [open, member, prefillParentId, prefillParent2Id, prefillLinkKind])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const existingPhoto = member ? familyPhotoUrl(member.photo_url) : null
  const showPreview = photoPreview ?? (removePhoto ? null : existingPhoto)

  // Référents possibles : tous les autres membres
  const possibleParents = treeMembers.filter((m) => m.id !== member?.id)
  const possibleParents2 = possibleParents.filter((m) => m.id !== parentId)
  const prefillParent = prefillParentId
    ? treeMembers.find((m) => m.id === prefillParentId)
    : null

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setRemovePhoto(false)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const values = {
      first_name: firstName,
      last_name: lastName,
      family_role: familyRole,
      generation_id: generationId || null,
      parent_id: parentId || null,
      parent2_id: parent2Id || null,
      link_kind: parentId ? linkKind : null,
      relation_label: relationLabel.trim() || null,
      linked_profile_id: linkedProfileId || null,
      photoFile,
      removePhoto,
    }
    const result = isEditing ? await onUpdate(member.id, values) : await onCreate(values)
    setSending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-encre/40 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        className="card-surface w-full max-w-lg p-6 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="member-modal-title" className="text-2xl font-semibold">
            {isEditing ? `Modifier ${member.first_name}` : 'Ajouter une personne'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ranger"
            className="min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra inline-flex items-center justify-center"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {/* Accroche pré-remplie via le « + » */}
        {!isEditing && prefillParent && (
          <p className="text-sm bg-sauge/15 border border-sauge/40 rounded-xl px-4 py-3 mb-4">
            {prefillLinkKind === 'partner' ? (
              <>
                À côté de <strong>{prefillParent.first_name}</strong> (partenaire — scotch entre les deux cartes).
              </>
            ) : (
              <>
                Accrochée à <strong>{prefillParent.first_name}</strong> dans l'arbre (en dessous).
              </>
            )}
          </p>
        )}
        {!isEditing && !prefillParent && (
          <p className="text-sm text-encre-soft mb-4">
            Pour quelqu'un qui n'a pas de compte — mamie Jeanne, par exemple. Elle figurera dans
            l'arbre et pourra être citée comme origine d'une recette.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextInput
            label="Prénom"
            htmlFor="member-first-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jeanne"
          />
          <TextInput
            label="Nom de famille (facultatif)"
            htmlFor="member-last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Dupont"
          />
          <TextInput
            label="Surnom dans la famille (facultatif)"
            htmlFor="member-role"
            hint="« mamie », « papi »… — affiché sous la photo"
            value={familyRole}
            onChange={(e) => setFamilyRole(e.target.value)}
            placeholder="Mamie"
          />

          {/* ---------- Relié à … (type de lien + une ou deux personnes) ---------- */}
          <div className="rounded-2xl border-2 border-dashed border-terra/40 bg-creme p-4 space-y-4">
            <p className="font-bold text-encre">Relié à …</p>
            <div>
              <label htmlFor="member-parent" className="block font-bold text-encre mb-1.5">
                Une personne (facultatif)
              </label>
              <select
                id="member-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
              >
                <option value="">— Personne (base de l'arbre) —</option>
                {possibleParents.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name}
                    {m.last_name ? ` ${m.last_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {parentId && (
              <div>
                <span className="block font-bold text-encre mb-1.5">Type de lien</span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type de lien">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={linkKind === 'parent'}
                    onClick={() => {
                      setLinkKind('parent')
                      setParent2Id('')
                    }}
                    className={cn(
                      'min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-bold text-left transition-colors',
                      linkKind === 'parent'
                        ? 'border-terra bg-terra/10 text-encre'
                        : 'border-encre/20 bg-creme text-encre-soft hover:border-terra/50',
                    )}
                  >
                    Enfant — en dessous
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={linkKind === 'partner'}
                    onClick={() => setLinkKind('partner')}
                    className={cn(
                      'min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-bold text-left transition-colors',
                      linkKind === 'partner'
                        ? 'border-terra bg-terra/10 text-encre'
                        : 'border-encre/20 bg-creme text-encre-soft hover:border-terra/50',
                    )}
                  >
                    Partenaire — à côté
                  </button>
                </div>
                <p className="text-sm text-encre-soft mt-1.5">
                  {linkKind === 'partner'
                    ? 'Conjoint·e, copine, pacsé·e… : à côté, même génération (scotch entre les deux cartes).'
                    : 'Fils, fille, recueilli·e… : en dessous du référent (l’arbre descend).'}
                </p>
              </div>
            )}
            {parentId && linkKind === 'parent' && (
              <div>
                <label htmlFor="member-parent2" className="block font-bold text-encre mb-1.5">
                  Et aussi (facultatif)
                </label>
                <select
                  id="member-parent2"
                  value={parent2Id}
                  onChange={(e) => setParent2Id(e.target.value)}
                  className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
                >
                  <option value="">— Une seule personne —</option>
                  {possibleParents2.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name}
                      {m.last_name ? ` ${m.last_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TextInput
              label="Lien (écrit librement)"
              htmlFor="member-relation"
              hint="« fils de », « marié à », « recueilli par »… — écris ce que tu veux, c’est juste pour la carte"
              value={relationLabel}
              onChange={(e) => setRelationLabel(e.target.value)}
              placeholder="fils de"
              disabled={!parentId}
            />
          </div>

          {/* Génération nommée (conservée pour historique, facultative) */}
          {generations.length > 0 && (
            <div>
              <label htmlFor="member-generation" className="block font-bold text-encre mb-1.5">
                Génération (facultative)
              </label>
              <select
                id="member-generation"
                value={generationId}
                onChange={(e) => setGenerationId(e.target.value)}
                className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
              >
                <option value="">— Non classée —</option>
                {generations.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lien vers un compte Savia */}
          <div>
            <label htmlFor="member-profile" className="block font-bold text-encre mb-1.5">
              Lier à un compte Savia (facultatif)
            </label>
            <select
              id="member-profile"
              value={linkedProfileId}
              onChange={(e) => setLinkedProfileId(e.target.value)}
              className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
            >
              <option value="">— Personne sans compte —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                  {p.family_role ? ` (${p.family_role})` : ''}
                </option>
              ))}
            </select>
            <p className="text-sm text-encre-soft mt-1.5">
              Le membre portera le badge « connecté » dans l'arbre.
            </p>
          </div>

          {/* Photo */}
          <div>
            <span className="block font-bold text-encre mb-1.5">Photo en pleine action dans la cuisine</span>
            <label
              htmlFor="member-photo"
              className={cn(
                'cursor-pointer w-full min-h-11 inline-flex items-center justify-center gap-2 px-5 rounded-2xl border-2 border-dashed font-bold transition-colors',
                photoFile
                  ? 'border-sauge bg-sauge/10 text-encre'
                  : 'border-encre/25 bg-creme hover:border-terra hover:text-terra',
              )}
            >
              <ImagePlus size={20} aria-hidden="true" />
              {photoFile || showPreview ? 'Changer la photo' : 'Choisir une photo'}
            </label>
            <input id="member-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            {showPreview && (
              <span className="relative inline-block mt-3">
                <img
                  src={showPreview}
                  alt="Aperçu de la photo"
                  className="w-full max-h-56 object-cover rounded-xl border-2 border-encre/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                    setRemovePhoto(true)
                  }}
                  aria-label="Retirer la photo"
                  className="absolute top-2 right-2 min-h-11 min-w-11 rounded-full bg-carmine text-creme flex items-center justify-center"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>

          {error && (
            <p className="text-carmine font-bold" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Ranger
            </Button>
            <Button type="submit" disabled={sending || !firstName.trim()}>
              <Send size={18} aria-hidden="true" />
              {sending ? 'On enregistre…' : isEditing ? 'Enfourner' : 'Accrocher dans l’arbre'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
