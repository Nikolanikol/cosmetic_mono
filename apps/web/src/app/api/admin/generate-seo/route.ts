/**
 * POST /api/admin/generate-seo
 *
 * Generates SEO content for a product using Groq AI (Llama 3.3 70B).
 * Input:  product data (name, brand, category, ingredients, etc.)
 * Output: { meta_title_ru, meta_description_ru, description_ru }
 *
 * Auth: requires authenticated admin session.
 */

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getSupabaseServerClient } from '@/shared/api/supabaseServer';

// ── Input shape ───────────────────────────────────────────────────────────────

interface GenerateSeoInput {
  name_ru: string;
  name_en?: string;
  brand_name: string;
  category_name: string;
  description_ru?: string;
  skin_types?: string[];
  tags?: string[];
  routine_step?: number | null;
  ingredients?: {
    inci_name: string;
    name_ru?: string;
    purpose_ru?: string;
    is_highlighted?: boolean;
  }[];
}

// ── Skin type labels ──────────────────────────────────────────────────────────

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: 'Сухая',
  oily: 'Жирная',
  combination: 'Комбинированная',
  sensitive: 'Чувствительная',
  normal: 'Нормальная',
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Auth check — must be authenticated admin
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Auth error' }, { status: 401 });
  }

  // 2. Parse body
  let body: GenerateSeoInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.name_ru || !body.brand_name) {
    return NextResponse.json(
      { error: 'name_ru and brand_name are required' },
      { status: 400 }
    );
  }

  // 3. Build context string
  const skinTypesStr =
    body.skin_types?.length
      ? body.skin_types.map((s) => SKIN_TYPE_LABELS[s] ?? s).join(', ')
      : null;

  const keyIngredients = (body.ingredients ?? [])
    .filter((i) => i.is_highlighted)
    .map((i) => `${i.name_ru ?? i.inci_name}${i.purpose_ru ? ` (${i.purpose_ru})` : ''}`)
    .join('; ');

  const allIngredients = (body.ingredients ?? [])
    .map((i) => i.inci_name)
    .join(', ');

  const productContext = {
    название: body.name_ru,
    ...(body.name_en ? { 'название_en': body.name_en } : {}),
    бренд: body.brand_name,
    категория: body.category_name,
    ...(skinTypesStr ? { 'тип_кожи': skinTypesStr } : {}),
    ...(body.tags?.length ? { теги: body.tags.join(', ') } : {}),
    ...(body.routine_step ? { 'шаг_рутины': body.routine_step } : {}),
    ...(keyIngredients ? { 'ключевые_ингредиенты': keyIngredients } : {}),
    ...(allIngredients ? { 'полный_состав': allIngredients } : {}),
    ...(body.description_ru ? { 'существующее_описание': body.description_ru } : {}),
  };

  const prompt = `Ты профессиональный SEO-копирайтер для российского beauty e-commerce магазина K&E Beauty, специализирующегося на корейской и европейской косметике.

Сгенерируй SEO-контент на РУССКОМ языке для следующего товара.

ВАЖНЫЕ ПРАВИЛА:
- meta_title_ru: строго до 70 символов, формат "{Название бренда} {Короткое название} — купить | K&E Beauty"
- meta_description_ru: строго до 160 символов, включи УТП + призыв к действию
- description_ru: развёрнутое SEO-описание с markdown-заголовками (##). Если существующее описание уже есть — улучши его и дополни секциями. Структура:

## Описание
[3-4 информативных предложения о продукте и его назначении]

## Ключевые ингредиенты
[Только если ингредиенты указаны — объясни действие каждого ключевого компонента]

## Для какого типа кожи
[Рекомендации на основе типа кожи и состава]

## Как применять
[Конкретная инструкция по применению в рамках K-beauty рутины]

## Результат
[Чего ожидать покупателю через 2-4 недели применения]

Данные о товаре:
${JSON.stringify(productContext, null, 2)}

Верни ТОЛЬКО валидный JSON без markdown-обёртки, без пояснений:
{"meta_title_ru":"...","meta_description_ru":"...","description_ru":"..."}`;

  // 4. Call Groq (Llama 3.3 70B — free, fast, great Russian)
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Ты профессиональный SEO-копирайтер. Отвечай ТОЛЬКО валидным JSON без markdown-обёртки.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const rawText = completion.choices[0]?.message?.content?.trim() ?? '';

    // Parse JSON — model may wrap in ```json ... ```
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      meta_title_ru: string;
      meta_description_ru: string;
      description_ru: string;
    };

    // Enforce hard limits
    const result = {
      meta_title_ru: parsed.meta_title_ru?.slice(0, 70) ?? '',
      meta_description_ru: parsed.meta_description_ru?.slice(0, 160) ?? '',
      description_ru: parsed.description_ru ?? '',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[generate-seo] Groq error:', error);
    return NextResponse.json(
      { error: 'AI generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
