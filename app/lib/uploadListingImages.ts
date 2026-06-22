import type { SupabaseClient } from '@supabase/supabase-js'

// Загружает файлы в bucket listing-images под безопасными именами и возвращает
// их публичные URL в том же порядке. Бросает ошибку при сбое загрузки.
// Используется формой редактирования (и может быть переиспользован submit).
export async function uploadListingImages(supabase: SupabaseClient, files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
    const path = ext ? `${crypto.randomUUID()}.${ext}` : crypto.randomUUID()
    const { error } = await supabase.storage.from('listing-images').upload(path, file)
    if (error) throw new Error(error.message)
    const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path)
    urls.push(pub.publicUrl)
  }
  return urls
}
