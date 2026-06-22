'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogIn, Send } from 'lucide-react';
import { createClient } from '../../lib/supabaseClient';

type Message = {
  id: number;
  conversation_id: number;
  sender_id: string;
  body: string;
  created_at: string;
};
type Conversation = {
  id: number;
  listing_id: number;
  buyer_id: string;
  seller_id: string;
  listings: { title: string } | { title: string }[] | null;
};

export default function ThreadPage() {
  const params = useParams();
  const id = String(params.id);

  const [supabase] = useState(() => createClient());
  // undefined — ещё проверяем сессию, null — гость, иначе id пользователя.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  // undefined — ещё грузим, null — нет доступа/не найдено, иначе диалог.
  const [conversation, setConversation] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Проверяем участие и грузим сообщения, когда пользователь известен.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      // RLS вернёт диалог только участнику — пусто означает «нет доступа».
      const { data: conv } = await supabase
        .from('conversations')
        .select('id, listing_id, buyer_id, seller_id, listings(title)')
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (!conv) { setConversation(null); return; }
      setConversation(conv as unknown as Conversation);

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });
      if (!cancelled) setMessages((msgs as Message[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [supabase, userId, id]);

  // Realtime: подписываемся только подтверждённым участником; отписка в cleanup.
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, id, conversation]);

  // Автоскролл вниз при новых сообщениях.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !userId || sending) return;
    setSending(true);
    setText('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: Number(id), sender_id: userId, body })
      .select()
      .single();
    setSending(false);
    if (error) {
      setText(body); // вернём текст, чтобы не потерять
      alert('Не удалось отправить: ' + error.message);
      return;
    }
    // Мгновенный эхо; realtime пришлёт ту же строку — отсечём дедупом по id.
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message]));
  }

  const listing = conversation
    ? (Array.isArray(conversation.listings) ? conversation.listings[0] : conversation.listings)
    : null;
  const role = conversation ? (conversation.buyer_id === userId ? 'Вы покупатель' : 'Вы продавец') : '';

  const Header = (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-5 py-4">
        <Link href="/messages" className="flex items-center gap-2 text-gray-500 hover:text-blue-700 transition-colors text-sm font-semibold">
          <ArrowLeft size={18} /> К сообщениям
        </Link>
      </div>
    </header>
  );

  if (userId === undefined) {
    return <div className="min-h-screen bg-[#f4f6f9]">{Header}<main className="max-w-2xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main></div>;
  }

  if (userId === null) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {Header}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 grid place-items-center"><LogIn size={26} /></div>
            <div className="text-lg font-extrabold text-gray-900">Войдите, чтобы открыть диалог</div>
            <Link href="/login" className="post-btn justify-center !h-12 w-full max-w-xs">Войти</Link>
          </div>
        </main>
      </div>
    );
  }

  if (conversation === undefined) {
    return <div className="min-h-screen bg-[#f4f6f9]">{Header}<main className="max-w-2xl mx-auto px-5 py-8 text-gray-400 text-sm">Загрузка…</main></div>;
  }

  if (conversation === null) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        {Header}
        <main className="max-w-2xl mx-auto px-5 py-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600 font-semibold mb-3">Нет доступа к этому диалогу</p>
            <Link href="/messages" className="font-bold text-blue-700 hover:underline">К сообщениям</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      {Header}

      <main className="max-w-2xl w-full mx-auto px-5 py-6 flex-1 flex flex-col">
        {/* Шапка диалога: объявление + моя роль */}
        <Link href={`/listings/${conversation.listing_id}`} className="bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-4 block hover:border-blue-300 transition-colors">
          <div className="font-bold text-gray-900 truncate">{listing?.title ?? 'Объявление'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{role}</div>
        </Link>

        {/* Лента сообщений */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-2">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Сообщений пока нет. Напишите первым.</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm ${mine ? 'self-end bg-blue-600 text-white' : 'self-start bg-white border border-gray-200 text-gray-900'}`}>
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Поле ввода */}
        <form onSubmit={send} className="flex items-end gap-2 mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            placeholder="Напишите сообщение…"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 bg-white text-gray-900 placeholder:text-gray-400"
          />
          <button type="submit" disabled={sending || !text.trim()} className="btn btn-grad flex-none disabled:opacity-50" style={{ height: 44, width: 44, padding: 0, borderRadius: 12 }} aria-label="Отправить">
            <Send size={18} />
          </button>
        </form>
      </main>
    </div>
  );
}
