/**
 * Review-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

import type { Profile } from './user';
import type { SkinType } from './user';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number; // 1-5
  title: string | null;
  body: string | null;
  skin_type: SkinType | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ReviewInsert {
  id?: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  skin_type?: SkinType | null;
  is_verified_purchase?: boolean;
  helpful_count?: number;
  created_at?: string;
}

export interface ReviewUpdate {
  rating?: number;
  title?: string | null;
  body?: string | null;
  skin_type?: SkinType | null;
  helpful_count?: number;
  updated_at?: string;
}

export interface ReviewWithUser extends Review {
  user: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface ReviewSummary {
  product_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewFilters {
  product_id?: string;
  user_id?: string;
  rating?: number;
  verified_only?: boolean;
  sort_by?: 'newest' | 'helpful' | 'rating_high' | 'rating_low';
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  created_at: string;
}
