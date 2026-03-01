/**
 * Quiz API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  QuizResult,
  QuizResultInsert,
  SkinType,
  QuizAnswer,
  ProductWithDefaultVariant,
} from '../types';
import { QUIZ_QUESTIONS, SKIN_TYPE_DESCRIPTIONS } from '../types';

// Re-export quiz questions and descriptions
export { QUIZ_QUESTIONS, SKIN_TYPE_DESCRIPTIONS };

/**
 * Get quiz questions
 */
export function getQuizQuestions() {
  return QUIZ_QUESTIONS;
}

/**
 * Calculate skin type from quiz answers
 */
export function calculateSkinType(answers: QuizAnswer[]): SkinType {
  const scores: Record<SkinType, number> = {
    dry: 0,
    oily: 0,
    combination: 0,
    sensitive: 0,
    normal: 0,
  };

  // Aggregate scores from all answers
  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.question_id);
    if (question) {
      const option = question.options.find((o) => o.id === answer.option_id);
      if (option) {
        for (const [skinType, score] of Object.entries(option.scores)) {
          scores[skinType as SkinType] += score;
        }
      }
    }
  }

  // Find the skin type with highest score
  let maxScore = -1;
  let result: SkinType = 'normal';

  for (const [skinType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      result = skinType as SkinType;
    }
  }

  return result;
}

/**
 * Get skin type description
 */
export function getSkinTypeDescription(skinType: SkinType) {
  return SKIN_TYPE_DESCRIPTIONS[skinType];
}

/**
 * Get recommended products based on skin type
 */
export async function getRecommendedProducts(
  supabase: SupabaseClient,
  skinType: SkinType,
  limit: number = 8
): Promise<ProductWithDefaultVariant[]> {
  // Get products that match the skin type or are suitable for all skin types
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name_ru,
      name_en,
      slug,
      is_active,
      is_featured,
      routine_step,
      skin_types,
      tags,
      created_at,
      brand:brands!inner(id, name, slug, origin_country),
      category:categories!inner(id, name_ru, slug),
      variants:product_variants(id, sku, name_ru, price_rub, sale_price_rub, stock, attributes),
      images:product_images(id, url, alt_ru, is_primary, sort_order)
    `
    )
    .eq('is_active', true)
    .or(`skin_types.cs.{${skinType}},skin_types.eq.{}`)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recommended products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => {
    const variants = (item.variants as { id: string; sku: string; name_ru: string; price_rub: number; sale_price_rub: number | null; stock: number; attributes: Record<string, string> }[]) || [];
    const images = (item.images as { id: string; url: string; alt_ru: string | null; is_primary: boolean; sort_order: number }[]) || [];
    return {
      id: item.id as string,
      name_ru: item.name_ru as string,
      name_en: item.name_en as string,
      slug: item.slug as string,
      is_active: item.is_active as boolean,
      is_featured: item.is_featured as boolean,
      routine_step: item.routine_step as number | null,
      skin_types: (item.skin_types as string[]) || [],
      tags: (item.tags as string[]) || [],
      created_at: item.created_at as string,
      brand: item.brand as { id: string; name: string; slug: string; origin_country: string },
      category: item.category as { id: string; name_ru: string; slug: string },
      default_variant: variants[0] || null,
      primary_image: images.find((img) => img.is_primary) || images[0] || null,
      average_rating: 0,
      review_count: 0,
    };
  });
}

/**
 * Save quiz result
 */
export async function saveQuizResult(
  supabase: SupabaseClient,
  result: QuizResultInsert
): Promise<QuizResult> {
  const { data, error } = await supabase
    .from('quiz_results')
    .insert(result)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save quiz result: ${error.message}`);
  }

  return data as QuizResult;
}

/**
 * Get quiz result by ID
 */
export async function getQuizResultById(
  supabase: SupabaseClient,
  resultId: string
): Promise<QuizResult | null> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('id', resultId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch quiz result: ${error.message}`);
  }

  return data as QuizResult;
}

/**
 * Get user's latest quiz result
 */
export async function getUserQuizResult(
  supabase: SupabaseClient,
  userId: string
): Promise<QuizResult | null> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user quiz result: ${error.message}`);
  }

  return data as QuizResult | null;
}

/**
 * Get session quiz result
 */
export async function getSessionQuizResult(
  supabase: SupabaseClient,
  sessionId: string
): Promise<QuizResult | null> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch session quiz result: ${error.message}`);
  }

  return data as QuizResult | null;
}

/**
 * Link quiz result to user
 */
export async function linkQuizResultToUser(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('quiz_results')
    .update({ user_id: userId })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to link quiz result: ${error.message}`);
  }
}

/**
 * Process quiz submission and return result
 */
export async function processQuiz(
  supabase: SupabaseClient,
  answers: QuizAnswer[],
  sessionId?: string,
  userId?: string
): Promise<{
  skinType: SkinType;
  description: typeof SKIN_TYPE_DESCRIPTIONS[SkinType];
  recommendedProducts: ProductWithDefaultVariant[];
}> {
  // Calculate skin type
  const skinType = calculateSkinType(answers);

  // Get description
  const description = getSkinTypeDescription(skinType);

  // Get recommended products
  const recommendedProducts = await getRecommendedProducts(supabase, skinType);

  // Save result
  await saveQuizResult(supabase, {
    user_id: userId || null,
    session_id: sessionId || null,
    answers,
    skin_type_result: skinType,
    recommended_product_ids: recommendedProducts.map((p) => p.id),
  });

  return {
    skinType,
    description,
    recommendedProducts,
  };
}
