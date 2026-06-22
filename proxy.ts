import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// В Next.js 16 middleware называется proxy. Эта функция выполняется на каждый
// подходящий запрос и освежает токен сессии Supabase, синхронизируя cookies
// между сервером и браузером. На рендер страниц и публичные чтения не влияет.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() обновляет сессию, если токен устарел, и записывает свежие cookies.
  await supabase.auth.getUser()

  return response
}

export const config = {
  // Запускаем на всех путях, кроме статики и файлов изображений.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
