import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKET } from '@/lib/constants'

/**
 * Photo de profil : upload dans le bucket Storage existant
 * (recipe-photos, public — RLS : membre de la famille du dossier).
 * L'avatar vit sous {family_id}/avatars/ et l'URL publique complète
 * est écrite dans profiles.avatar_url (lue par <Avatar /> partout).
 */
export async function uploadAvatar(
  familyId: string,
  profileId: string,
  blob: Blob,
): Promise<string | null> {
  const path = `${familyId}/avatars/${profileId}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
