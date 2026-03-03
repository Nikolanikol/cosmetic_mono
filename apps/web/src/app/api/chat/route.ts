/**
 * POST /api/chat
 *
 * AI chat assistant with RAG — searches real products before answering.
 * Input:  { messages: { role: 'user'|'assistant', content: string }[] }
 * Output: streaming text/plain (Groq llama-3.3-70b-versatile)
 *
 * Public endpoint — no auth required.
 */

import Groq from 'groq-sdk';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProducts } from '@packages/api/products';
import type { SkinType } from '@packages/types/user';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Skin type detection ────────────────────────────────────────────────────────

const SKIN_KEYWORDS: [string, SkinType][] = [
  ['жирн', 'oily'],
  ['oily', 'oily'],
  ['сух', 'dry'],
  ['dry', 'dry'],
  ['комбинир', 'combination'],
  ['combination', 'combination'],
  ['чувствительн', 'sensitive'],
  ['sensitive', 'sensitive'],
  ['нормальн', 'normal'],
  ['normal', 'normal'],
];

function detectSkinType(text: string): SkinType | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, type] of SKIN_KEYWORDS) {
    if (lower.includes(keyword)) return type;
  }
  return undefined;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Parse messages
  let messages: ChatMessage[];
  try {
    const body = await request.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages', { status: 400 });
    }
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // ── RAG: fetch relevant products ────────────────────────────────────────────
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  let productContext = '';
  try {
    const supabase = getSupabaseServiceClient();
    const skinType = detectSkinType(lastUserMsg);

    const { products } = await getProducts(supabase, {
      filters: {
        search: lastUserMsg.slice(0, 100),
        ...(skinType ? { skin_type: skinType } : {}),
      },
      limit: 6,
    });

    if (products.length > 0) {
      const list = products
        .map((p, i) => {
          const price = p.default_variant?.price_rub;
          const priceStr = price ? `${price} руб.` : '';
          return `${i + 1}. ${p.name_ru} (${p.brand.name})${priceStr ? ` — ${priceStr}` : ''} → /product/${p.slug}`;
        })
        .join('\n');

      productContext = `

Товары из нашего каталога (используй их для рекомендаций):
${list}

Если товары релевантны — рекомендуй их. Давай ссылки строго в формате markdown: [Название](/product/slug).
Не рекомендуй товары которых нет в этом списке.`;
    }
  } catch {
    // Продолжаем без RAG если запрос не удался
  }

  // ── System prompt ───────────────────────────────────────────────────────────
  const systemPrompt = `Ты AI-консультант интернет-магазина K&E Beauty — корейская и европейская косметика.

Чем можешь помочь:
• Подбор средств по типу кожи (сухая, жирная, комбинированная, чувствительная, нормальная)
• Объяснение ингредиентов: ниацинамид, центелла, ретинол, гиалуроновая кислота, AHA/BHA, пептиды и др.
• Построение K-beauty рутины: очищение → тонер → эссенция → сыворотка → увлажнение → SPF
• Информация о доставке (Россия, 3-7 рабочих дней, СДЭК и Почта России) и оплате (карта через YooKassa)

Правила:
- Отвечай ТОЛЬКО на русском языке
- Будь дружелюбной, экспертной, лаконичной — максимум 4-5 предложений
- Рекомендуй товары ТОЛЬКО из предоставленного каталога, со ссылками в формате [Название](/product/slug)
- Не давай медицинских диагнозов — только косметические рекомендации
- Если вопрос не про косметику или магазин — мягко переведи тему
- Используй emoji умеренно ✨${productContext}`;

  // ── Groq streaming ──────────────────────────────────────────────────────────
  if (!process.env.GROQ_API_KEY) {
    return new Response('GROQ_API_KEY is not configured', { status: 503 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const groqStream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 600,
    temperature: 0.7,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  // Pipe Groq stream → Response stream
  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of groqStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
