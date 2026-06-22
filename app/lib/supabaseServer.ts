import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Серверный клиент для серверных компонентов и route handlers.
// Читает/пишет сессию через cookies. В Next 16 cookies() асинхронный — отсюда await.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Вызов из серверного компонента (где set запрещён) — это нормально:
            // обновление сессии берёт на себя proxy.ts.
          }
        },
      },
    }
  )
}
