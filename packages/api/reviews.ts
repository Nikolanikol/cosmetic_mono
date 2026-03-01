/**
 * Review API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Review,
  ReviewInsert,
  ReviewUpdate,
  ReviewWithUser,
  ReviewSummary,
  ReviewFilters,
} from '../types';

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  supabase: SupabaseClient,
  productId: string,
  params: {
    sortBy?: 'newest' | 'helpful' | 'rating_high' | 'rating_low';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ reviews: ReviewWithUser[]; total: number; total_pages: number }> {
  const { sortBy = 'newest', page = 1, limit = 10 } = params;

  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      user:profiles(id, full_name, avatar_url)
    `,
      { count: 'exact' }
    )
    .eq('product_id', productId);

  // Apply sorting
  switch (sortBy) {
    case 'helpful':
      query = query.order('helpful_count', { ascending: false });
      break;
    case 'rating_high':
      query = query.order('rating', { ascending: false });
      break;
    case 'rating_low':
      query = query.order('rating', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  return {
    reviews: (data || []) as unknown as ReviewWithUser[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get review summary for a product
 */
export async function getProductReviewSummary(
  supabase: SupabaseClient,
  productId: string
): Promise<ReviewSummary> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Failed to fetch review summary: ${error.message}`);
  }

  const reviews = (data || []) as { rating: number }[];
  const total = reviews.length;

  if (total === 0) {
    return {
      product_id: productId,
      average_rating: 0,
      total_reviews: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
  });

  return {
    product_id: productId,
    average_rating: Math.round((sum / total) * 10) / 10,
    total_reviews: total,
    rating_distribution: distribution,
  };
}

/**
 * Get a single review by ID
 */
export async function getReviewById(
  supabase: SupabaseClient,
  reviewId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch review: ${error.message}`);
  }

  return data as Review;
}

/**
 * Get user's review for a product
 */
export async function getUserProductReview(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user review: ${error.message}`);
  }

  return data as Review | null;
}

/**
 * Check if user has purchased a product (for verified purchase badge)
 */
export async function hasUserPurchasedProduct(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('order_items')
    .select('id')
    .eq('order.user_id', userId)
    .eq('product_snapshot->>product_id', productId)
    .limit(1);

  if (error) {
    return false;
  }

  return (data || []).length > 0;
}

/**
 * Create a new review
 */
export async function createReview(
  supabase: SupabaseClient,
  review: ReviewInsert
): Promise<Review> {
  // Check if user has purchased the product
  const isVerified = await hasUserPurchasedProduct(
    supabase,
    review.user_id,
    review.product_id
  );

  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...review, is_verified_purchase: isVerified })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create review: ${error.message}`);
  }

  return data as Review;
}

/**
 * Update a review
 */
export async function updateReview(
  supabase: SupabaseClient,
  reviewId: string,
  review: ReviewUpdate
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update(review)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update review: ${error.message}`);
  }

  return data as Review;
}

/**
 * Delete a review
 */
export async function deleteReview(
  supabase: SupabaseClient,
  reviewId: string
): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) {
    throw new Error(`Failed to delete review: ${error.message}`);
  }
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(
  supabase: SupabaseClient,
  reviewId: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_review_helpful', {
    review_id: reviewId,
  });

  if (error) {
    // Fallback: update directly
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    if (review) {
      await supabase
        .from('reviews')
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId);
    }
  }
}

/**
 * Get reviews by user
 */
export async function getUserReviews(
  supabase: SupabaseClient,
  userId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{ reviews: Review[]; total: number; total_pages: number }> {
  const { page = 1, limit = 10 } = params;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch user reviews: ${error.message}`);
  }

  return {
    reviews: (data || []) as Review[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}
