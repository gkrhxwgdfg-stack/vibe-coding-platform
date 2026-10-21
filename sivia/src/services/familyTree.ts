import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'
import type { FamilyEvent, FamilyMember } from '@/lib/types'

/**
 * Logique métier de la section Famille : arbre généalogique (membres
 * « de l'arbre », sans compte) et événements (repas de famille).
 * Garde les vues légères : aucun appel Supabase directement dans les pages.
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
    .order('generation', { ascending: true })
    .order('first_name', { ascending: true })
  if (error || !data) return []
  return data as FamilyMember[]
}

export async function createFamilyMember(
  familyId: string,
  createdBy: string,
  values: {
    first_name: string
    last_name: string
    family_role: string
    generation: number
    parent_id: string | null
    linked_profile_id: string | null
    photoFile: File | null
  },
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
      generation: values.generation,
      parent_id: values.parent_id,
      linked_profile_id: values.linked_profile_id,
      photo_url: photoPath,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error || !data) return { error: error?.message ?? 'Ajout impossible.', member: null }
  return { error: null, member: data as FamilyMember }
}

export async function deleteFamilyMember(memberId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('family_members').delete().eq('id', memberId)
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
