import { createClient } from './supabaseServer'

// Один запрос на страницу: возвращает, залогинен ли пользователь, и набор id
// его избранных объявлений. Серверный клиент читает сессию из cookies.
export async function getFavoriteContext(): Promise<{ isAuthed: boolean; favIds: Set<number> }> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { isAuthed: false, favIds: new Set() }

  const { data } = await sb.from('favorites').select('listing_id').eq('user_id', user.id)
  return { isAuthed: true, favIds: new Set((data ?? []).map((f) => f.listing_id as number)) }
}
