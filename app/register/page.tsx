'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { createClient } from '../lib/supabaseClient';
import { authErrorRu } from '../lib/authErrors';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Введите email и пароль');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(authErrorRu(error.message));
      setLoading(false);
      return;
    }
    // Если подтверждение email выключено — Supabase сразу выдаёт сессию, входим.
    // Если включено — сессии нет, показываем «проверьте почту».
    if (data.session) {
      router.push('/');
      router.refresh();
    } else {
      setCheckEmail(true);
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
        <header className="bg-white border-b border-[var(--line)]">
          <div className="max-w-2xl mx-auto px-5 py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-[var(--ink-3)] hover:text-[var(--blue-700)] transition-colors text-sm font-semibold">
              <ArrowLeft size={18} /> На главную
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md bg-white border border-[var(--line)] rounded-2xl shadow-sm p-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-2)] text-[var(--blue-700)] grid place-items-center mx-auto mb-4">
              <MailCheck size={26} />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-2">Проверьте почту</h1>
            <p className="text-sm text-[var(--ink-3)]">
              Мы отправили письмо на <b className="text-[var(--ink-2)]">{email}</b>. Перейдите по ссылке из письма, чтобы подтвердить регистрацию.
            </p>
            <Link href="/login" className="post-btn w-full justify-center !h-12 mt-6 inline-flex">
              Перейти ко входу
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <header className="bg-white border-b border-[var(--line)]">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--ink-3)] hover:text-[var(--blue-700)] transition-colors text-sm font-semibold">
            <ArrowLeft size={18} /> На главную
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md bg-white border border-[var(--line)] rounded-2xl shadow-sm p-7">
          <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-1">Регистрация</h1>
          <p className="text-sm text-[var(--ink-3)] mb-6">Создайте аккаунт tirgus.lv</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--ink-2)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full border border-[var(--line)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--blue-500)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-4)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--ink-2)] mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                autoComplete="new-password"
                className="w-full border border-[var(--line)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--blue-500)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-4)]"
              />
            </div>

            {error && (
              <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="post-btn w-full justify-center !h-12 mt-1 disabled:opacity-50"
            >
              {loading ? 'Создаём…' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-sm text-[var(--ink-3)] text-center mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-bold text-[var(--blue-700)] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
