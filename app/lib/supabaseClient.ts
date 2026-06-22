import { createBrowserClient } from '@supabase/ssr'

// Браузерный клиент для клиентских компонентов (вход/регистрация/шапка).
// Хранит сессию в cookies, поэтому её видят и серверные компоненты, и proxy.
// Публичные чтения по-прежнему идут через ./supabase (его не трогаем).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
