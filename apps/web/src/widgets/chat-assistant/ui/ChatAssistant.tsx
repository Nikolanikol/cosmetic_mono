'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── Quick-start chips ─────────────────────────────────────────────────────────

const QUICK_CHIPS = [
  {
    label: '💆 Подобрать по типу кожи',
    text: 'Помоги подобрать уход по типу кожи. У меня ',
    focusInput: true,
  },
  {
    label: '🧪 Что значат ингредиенты?',
    text: 'Объясни популярные ингредиенты в корейской косметике: ниацинамид, центелла, ретинол',
    focusInput: false,
  },
  {
    label: '✨ K-beauty рутина',
    text: 'Как правильно выстроить K-beauty рутину по шагам?',
    focusInput: false,
  },
  {
    label: '📦 Доставка и оплата',
    text: 'Расскажи про доставку и способы оплаты в K&E Beauty',
    focusInput: false,
  },
];

// ── Markdown-link renderer ────────────────────────────────────────────────────

function renderContent(text: string): React.ReactNode {
  // Split by [text](url) links and newlines
  const segments = text.split(/(\[[^\]]+\]\([^)]+\)|\n)/g);

  return segments.map((seg, i) => {
    if (seg === '\n') return <br key={i} />;

    const linkMatch = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      const isExternal = href.startsWith('http');
      return isExternal ? (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-brand-pink-300 hover:text-brand-pink-200"
        >
          {label}
        </a>
      ) : (
        <Link
          key={i}
          href={href}
          className="underline font-semibold text-brand-pink-300 hover:text-brand-pink-200"
        >
          {label}
        </Link>
      );
    }

    return <span key={i}>{seg}</span>;
  });
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex gap-1 items-center py-0.5">
      <span className="w-1.5 h-1.5 bg-brand-charcoal-400 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-brand-charcoal-400 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-brand-charcoal-400 rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Show unread dot when assistant replies while chat is closed
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!isOpen && last?.role === 'assistant' && last.content) {
      setHasUnread(true);
    }
  }, [messages, isOpen]);

  // ── Send message ─────────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant placeholder — will be filled by streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Network error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            ...last,
            content: 'Извини, что-то пошло не так. Попробуй ещё раз! 🙏',
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleChipClick(chip: (typeof QUICK_CHIPS)[number]) {
    if (chip.focusInput) {
      // Pre-fill input and focus so user can complete the sentence
      setInput(chip.text);
      setTimeout(() => {
        inputRef.current?.focus();
        const len = chip.text.length;
        inputRef.current?.setSelectionRange(len, len);
      }, 50);
    } else {
      sendMessage(chip.text);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Chat window ── */}
      {isOpen && (
        <div className="fixed bottom-[5.5rem] right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[520px] flex flex-col bg-brand-black-800 border border-brand-black-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-black-900 border-b border-brand-black-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-pink-500" />
              <span className="font-semibold text-white text-sm">K&amp;E Beauty Ассистент</span>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Онлайн" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-charcoal-400 hover:text-white transition-colors p-1"
              aria-label="Закрыть чат"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-brand-black-600">
            {/* Welcome + chips */}
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="bg-brand-black-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white max-w-[88%] leading-relaxed">
                  Привет! 👋 Я помогу подобрать косметику из нашего каталога, объясню состав и выстрою K-beauty рутину. С чего начнём?
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleChipClick(chip)}
                      disabled={isStreaming}
                      className="text-xs px-3 py-1.5 rounded-full border border-brand-pink-500/40 text-brand-pink-400 hover:bg-brand-pink-500/10 active:bg-brand-pink-500/20 transition-colors disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-brand-pink-500 text-white ml-auto rounded-tr-sm'
                    : 'bg-brand-black-700 text-white mr-auto rounded-tl-sm'
                )}
              >
                {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                  <TypingDots />
                ) : (
                  renderContent(msg.content)
                )}
              </div>
            ))}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 p-3 border-t border-brand-black-700 bg-brand-black-900">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите вопрос… (Enter — отправить)"
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-brand-black-700 text-white placeholder-brand-charcoal-400 text-sm rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-1 focus:ring-brand-pink-500 disabled:opacity-50 overflow-y-auto"
                style={{ minHeight: '40px', maxHeight: '96px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                aria-label="Отправить"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-brand-pink-500 hover:bg-brand-pink-400 active:bg-brand-pink-600 shadow-lg shadow-brand-pink-500/30 transition-all duration-200 flex items-center justify-center"
        aria-label={isOpen ? 'Закрыть чат' : 'Открыть чат с ассистентом'}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
        {/* Unread dot */}
        {hasUnread && !isOpen && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-brand-black-900" />
        )}
      </button>
    </>
  );
}
