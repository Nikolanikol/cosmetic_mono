/**
 * User-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

export type UserRole = 'customer' | 'admin';

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  skin_type: SkinType | null;
  created_at: string;
  updated_at?: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  skin_type?: SkinType | null;
  created_at?: string;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  skin_type?: SkinType | null;
  updated_at?: string;
}

export interface UserAddress {
  city: string;
  street: string;
  zip: string;
  apartment?: string;
}

export interface UserWithOrders extends Profile {
  orders_count: number;
  total_spent: number;
}
