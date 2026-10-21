import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, Send, Trash2, X } from 'lucide-react'
import { useFamilyTree } from '@/hooks/useFamilyTree'
import { useFamilyMembers } from '@/hooks/useFamily'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/FormFields'
import { cn } from '@/lib/utils'

interface AddFamilyMemberModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Modal « Ajouter un membre à l'arbre » : une personne de la famille sans
 * compte (ex : « Mamie Jeanne »), avec sa photo en pleine action dans la
 * cuisine, son lien familial et sa génération. Peut être liée à un compte
 * existant pour porter le badge « membre connecté ».
 */
export function AddFamilyMemberModal({ open, onClose }: AddFamilyMemberModalProps) {
  const { add, members: treeMembers } = useFamilyTree()
  const { members: profiles } = useFamilyMembers()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [familyRole, setFamilyRole] = useState('')
  const [generation, setGeneration] = useState('1')
  const [parentId, setParentId] = useState('')
  const [linkedProfileId, setLinkedProfileId] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parents possibles : les membres des générations aînées
  const selectedGeneration = Number.parseInt(generation, 10) || 1
  const possibleParents = treeMembers.filter((m) => m.generation < selectedGeneration)

  useEffect(() => {
    if (open) {
      setFirstName('')
      setLastName('')
      setFamilyRole('')
      setGeneration('1')
      setParentId('')
      setLinkedProfileId('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
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
    const { error: addError } = await add({
      first_name: firstName,
      last_name: lastName,
      family_role: familyRole,
      generation: Number.parseInt(generation, 10) || 1,
      parent_id: parentId || null,
      linked_profile_id: linkedProfileId || null,
      photoFile,
    })
    setSending(false)
    if (addError) {
      setError(addError)
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
        aria-labelledby="add-member-title"
        className="card-surface w-full max-w-lg p-6 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-member-title" className="text-2xl font-semibold">
            Ajouter un membre à l'arbre
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="min-h-11 min-w-11 rounded-full text-encre-soft hover:text-terra inline-flex items-center justify-center"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-encre-soft mb-4">
          Pour quelqu'un qui n'a pas de compte — mamie Jeanne, par exemple. Elle figurera dans
          l'arbre et pourra être citée comme origine d'une recette.
        </p>

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
            label="Lien familial"
            htmlFor="member-role"
            hint="« maman », « papi », « cousine Léa »…"
            value={familyRole}
            onChange={(e) => setFamilyRole(e.target.value)}
            placeholder="Mamie"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="member-generation" className="block font-bold text-encre mb-1.5">
                Génération
              </label>
              <select
                id="member-generation"
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
              >
                {[1, 2, 3, 4].map((g) => (
                  <option key={g} value={g}>
                    {g === 1 ? '1 — les aînés' : `${g}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="member-parent" className="block font-bold text-encre mb-1.5">
                Parent dans l'arbre (facultatif)
              </label>
              <select
                id="member-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full min-h-11 rounded-xl border-2 border-encre/20 bg-creme px-4 py-2.5 focus:border-terra focus:outline-none"
              >
                <option value="">— Aucun —</option>
                {possibleParents.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.first_name}
                    {m.last_name ? ` ${m.last_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              {photoFile ? 'Changer la photo' : 'Choisir une photo'}
            </label>
            <input id="member-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
            {photoPreview && (
              <span className="relative inline-block mt-3">
                <img
                  src={photoPreview}
                  alt="Aperçu de la photo"
                  className="w-full max-h-56 object-cover rounded-xl border-2 border-encre/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
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
              Annuler
            </Button>
            <Button type="submit" disabled={sending || !firstName.trim()}>
              <Send size={18} aria-hidden="true" />
              {sending ? 'On plante le fil…' : "Ajouter à l'arbre"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
