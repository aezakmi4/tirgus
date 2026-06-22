'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '../lib/supabaseClient';
import { authErrorRu } from '../lib/authErrors';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Введите email и пароль');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(authErrorRu(error.message));
      setLoading(false);
      return;
    }
    // Обновляем серверные компоненты, чтобы они увидели сессию, и уходим на главную.
    router.push('/');
    router.refresh();
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
          <h1 className="text-2xl font-extrabold text-[var(--ink)] mb-1">Вход</h1>
          <p className="text-sm text-[var(--ink-3)] mb-6">Войдите в аккаунт tirgus.lv</p>

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
                placeholder="••••••••"
                autoComplete="current-password"
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
              {loading ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="text-sm text-[var(--ink-3)] text-center mt-6">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-bold text-[var(--blue-700)] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
