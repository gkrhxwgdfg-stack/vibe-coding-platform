import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { Database } from '@/lib/database.types'
import type { FamilyEvent, FamilyGeneration, FamilyMember } from '@/lib/types'

/**
 * Logique métier de la section Famille : arbre généalogique (membres
 * « de l'arbre », sans compte), générations nommées et événements
 * (repas de famille). Garde les vues légères : aucun appel Supabase
 * directement dans les pages.
 */

/** Upload la photo d'un membre de l'arbre ou d'un événement, dossier = family_id */
async function uploadFamilyPhoto(familyId: string, folder: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${familyId}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) return null
  return path
}

/** URL publique d'une photo (bucket public) */
export function familyPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ---------- Arbre généalogique ----------

export async function fetchFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .order('first_name', { ascending: true })
  if (error || !data) return []
  return data as FamilyMember[]
}

export interface FamilyMemberFormValues {
  first_name: string
  last_name: string
  family_role: string
  /** Génération nommée choisie (null = génération 0, non classés) — conservé pour historique */
  generation_id: string | null
  /** Premier référent (« relié à … ») : parent (branche vers le bas) ou partenaire (à côté) */
  parent_id: string | null
  /** Second référent facultatif (« et aussi » : relié aux deux) */
  parent2_id: string | null
  /** Type de lien EXPLICITE : 'parent' (enfant, en dessous) ou 'partner'
   *  (conjoint·e / copine, à côté, même génération). Jamais déduit du texte. */
  link_kind: 'parent' | 'partner' | null
  /** Lien LIBRE avec le référent : l'utilisateur écrit ce qu'il veut
   *  (« fils de », « marié à », « recueilli par »…) — affiché, jamais interprété. */
  relation_label: string | null
  linked_profile_id: string | null
  photoFile: File | null
  /** Retirer la photo existante (édition) */
  removePhoto?: boolean
}

/** Nature du lien : explicite (choix du formulaire), jamais déduite du texte. */
function linkKindFor(values: FamilyMemberFormValues): 'parent' | 'partner' | null {
  if (!values.parent_id) return null
  return values.link_kind === 'partner' ? 'partner' : 'parent'
}

/**
 * Auto-lien de la base : quand on crée une personne SANS référent (bouton
 * « + » carmine du haut), les racines existantes de l'arbre (les aînés qui
 * n'ont pas de parent) sont rattachées à cette nouvelle personne : elle
 * devient leur parent, donc elle apparaît AU-DESSUS d'elles. L'arbre garde
 * sa vraie structure (les aînés les plus anciens en haut), même si on les
 * ajoute après coup.
 */
async function adoptExistingRoots(familyId: string, newMemberId: string): Promise<void> {
  // Racines = membres sans parent_id (et pas des partenaires)
  const { data: roots } = await supabase
    .from('family_members')
    .select('id, link_kind')
    .eq('family_id', familyId)
    .is('parent_id', null)
  if (!roots || roots.length === 0) return
  const rootIds = roots
    .filter((r) => r.link_kind !== 'partner')
    .map((r) => r.id)
    .filter((id) => id !== newMemberId)
  if (rootIds.length === 0) return
  await supabase
    .from('family_members')
    .update({ parent_id: newMemberId, link_kind: 'parent' })
    .in('id', rootIds)
}

export async function createFamilyMember(
  familyId: string,
  createdBy: string,
  values: FamilyMemberFormValues,
): Promise<{ error: string | null; member: FamilyMember | null }> {
  const firstName = values.first_name.trim()
  if (!firstName) return { error: 'Il faut au moins un prénom.', member: null }
  let photoPath: string | null = null
  if (values.photoFile) {
    photoPath = await uploadFamilyPhoto(familyId, 'tree', values.photoFile)
    if (!photoPath) return { error: "La photo n'a pas pu être envoyée. Réessaie ?", member: null }
  }
  const { data, error } = await supabase
    .from('family_members')
    .insert({
      family_id: familyId,
      first_name: firstName,
      last_name: values.last_name.trim() || null,
      family_role: values.family_role.trim() || null,
      generation_id: values.generation_id,
      parent_id: values.parent_id,
      parent2_id: values.parent2_id,
      link_kind: linkKindFor(values),
      relation_label: values.relation_label,
      linked_profile_id: values.linked_profile_id,
      photo_url: photoPath,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error || !data) return { error: error?.message ?? 'Ajout impossible.', member: null }
  const member = data as FamilyMember
  // Création sans référent (bouton « + » du haut) : les racines existantes
  // deviennent ses enfants → elle passe au-dessus, l'arbre reste structuré.
  if (!values.parent_id) {
    await adoptExistingRoots(familyId, member.id)
  }
  return { error: null, member }
}

/** Modifie un membre de l'arbre (n'importe quel membre de la famille, cf. RLS) */
export async function updateFamilyMember(
  memberId: string,
  familyId: string,
  values: FamilyMemberFormValues,
): Promise<{ error: string | null; member: FamilyMember | null }> {
  const firstName = values.first_name.trim()
  if (!firstName) return { error: 'Il faut au moins un prénom.', member: null }

  let photoPath: string | null | undefined = undefined
  if (values.photoFile) {
    photoPath = await uploadFamilyPhoto(familyId, 'tree', values.photoFile)
    if (!photoPath) return { error: "La photo n'a pas pu être envoyée. Réessaie ?", member: null }
  } else if (values.removePhoto) {
    photoPath = null
  }

  const payload: Database['public']['Tables']['family_members']['Update'] = {
    first_name: firstName,
    last_name: values.last_name.trim() || null,
    family_role: values.family_role.trim() || null,
    generation_id: values.generation_id,
    parent_id: values.parent_id,
    parent2_id: values.parent2_id,
    link_kind: linkKindFor(values),
    relation_label: values.relation_label,
    linked_profile_id: values.linked_profile_id,
  }
  if (photoPath !== undefined) payload.photo_url = photoPath

  const { data, error } = await supabase
    .from('family_members')
    .update(payload)
    .eq('id', memberId)
    .select()
    .single()
  if (error || !data) return { error: error?.message ?? 'Modification impossible.', member: null }
  return { error: null, member: data as FamilyMember }
}

export async function deleteFamilyMember(memberId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('family_members').delete().eq('id', memberId)
  return { error: error?.message ?? null }
}

// ---------- Générations nommées ----------

export async function fetchFamilyGenerations(familyId: string): Promise<FamilyGeneration[]> {
  const { data, error } = await supabase
    .from('family_generations')
    .select('*')
    .eq('family_id', familyId)
    .order('position', { ascending: true })
  if (error || !data) return []
  return data as FamilyGeneration[]
}

/** Crée une génération nommée. `position` = nombre de générations existantes + 1. */
export async function createFamilyGeneration(
  familyId: string,
  createdBy: string,
  name: string,
): Promise<{ error: string | null; generation: FamilyGeneration | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Il faut un nom pour cette génération.', generation: null }
  const existing = await fetchFamilyGenerations(familyId)
  const position = existing.length + 1
  const { data, error } = await supabase
    .from('family_generations')
    .insert({ family_id: familyId, name: trimmed, position, created_by: createdBy })
    .select()
    .single()
  if (error || !data) return { error: error?.message ?? 'Création impossible.', generation: null }
  return { error: null, generation: data as FamilyGeneration }
}

export async function deleteFamilyGeneration(generationId: string): Promise<{ error: string | null }> {
  // Les membres de cette génération redeviennent « non classés » (génération 0)
  const { error } = await supabase.from('family_generations').delete().eq('id', generationId)
  return { error: error?.message ?? null }
}

// ---------- Événements & souvenirs ----------

export type FamilyEventWithRecipes = FamilyEvent

export async function fetchFamilyEvents(familyId: string): Promise<FamilyEventWithRecipes[]> {
  const { data, error } = await supabase
    .from('family_events')
    .select('*, event_recipes(recipe_id, recipe:recipes!event_recipes_recipe_id_fkey(id, title))')
    .eq('family_id', familyId)
    .order('event_date', { ascending: false })
  if (error || !data) return []
  return (data as unknown as (FamilyEvent & {
    event_recipes: { recipe_id: string; recipe: { id: string; title: string } | null }[] | null
  })[]).map((row) => ({
    ...row,
    recipes: (row.event_recipes ?? [])
      .filter((link) => link.recipe)
      .map((link) => ({ id: link.recipe!.id, title: link.recipe!.title })),
  }))
}

export async function createFamilyEvent(
  familyId: string,
  createdBy: string,
  values: {
    title: string
    event_date: string
    note: string
    photoFile: File | null
    recipeIds: string[]
  },
): Promise<{ error: string | null; event: FamilyEventWithRecipes | null }> {
  const title = values.title.trim()
  if (!title) return { error: 'Il faut un nom pour ce repas.', event: null }
  if (!values.event_date) return { error: 'Il faut une date pour ce souvenir.', event: null }
  let photoPath: string | null = null
  if (values.photoFile) {
    photoPath = await uploadFamilyPhoto(familyId, 'events', values.photoFile)
    if (!photoPath) return { error: "La photo n'a pas pu être envoyée. Réessaie ?", event: null }
  }
  const { data, error } = await supabase
    .from('family_events')
    .insert({
      family_id: familyId,
      title,
      event_date: values.event_date,
      note: values.note.trim() || null,
      photo_url: photoPath,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error || !data) return { error: error?.message ?? 'Création impossible.', event: null }
  const event = data as FamilyEvent
  if (values.recipeIds.length > 0) {
    const { error: linkError } = await supabase
      .from('event_recipes')
      .insert(values.recipeIds.map((recipe_id) => ({ event_id: event.id, recipe_id })))
    if (linkError) return { error: linkError.message, event }
  }
  return { error: null, event }
}

export async function deleteFamilyEvent(eventId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('family_events').delete().eq('id', eventId)
  return { error: error?.message ?? null }
}
