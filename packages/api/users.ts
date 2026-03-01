/**
 * User API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, ProfileInsert, ProfileUpdate, UserAddress } from '../types';

/**
 * Get user profile by ID
 */
export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Get current user profile
 */
export async function getCurrentProfile(
  supabase: SupabaseClient
): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  return getProfileById(supabase, user.id);
}

/**
 * Create a new profile
 */
export async function createProfile(
  supabase: SupabaseClient,
  profile: ProfileInsert
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Update user profile
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as Profile;
}

/**
 * Update user skin type
 */
export async function updateSkinType(
  supabase: SupabaseClient,
  userId: string,
  skinType: string
): Promise<Profile> {
  return updateProfile(supabase, userId, { skin_type: skinType as ProfileUpdate['skin_type'] });
}

/**
 * Check if user is admin
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === 'admin';
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(
  supabase: SupabaseClient,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<{ users: Profile[]; total: number; total_pages: number }> {
  const { page = 1, limit = 20, search } = params;

  let query = supabase.from('profiles').select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return {
    users: (data || []) as Profile[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Delete profile first (cascades to other tables via RLS)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to delete user profile: ${profileError.message}`);
  }

  // Delete auth user (requires service role)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    throw new Error(`Failed to delete auth user: ${authError.message}`);
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: 'customer' | 'admin'
): Promise<Profile> {
  return updateProfile(supabase, userId, { role });
}
