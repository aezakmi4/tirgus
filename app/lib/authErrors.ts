// Переводим типовые сообщения Supabase Auth в понятный русский.
// Если конкретное сообщение не распознали — отдаём общий запасной текст.
export function authErrorRu(message: string | undefined): string {
  const m = (message || '').toLowerCase()

  if (m.includes('invalid login credentials')) return 'Неверный email или пароль'
  if (m.includes('email not confirmed')) return 'Email не подтверждён — проверьте почту'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Этот email уже зарегистрирован'
  if (m.includes('password should be at least'))
    return 'Пароль должен быть не короче 6 символов'
  if (m.includes('unable to validate email address') || m.includes('invalid email'))
    return 'Некорректный email'
  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many'))
    return 'Слишком много попыток. Попробуйте чуть позже'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Нет связи с сервером. Проверьте интернет'

  return 'Что-то пошло не так. Попробуйте ещё раз'
}
