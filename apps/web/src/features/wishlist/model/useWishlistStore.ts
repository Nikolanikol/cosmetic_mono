import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseBrowser } from '@/shared/api/supabaseClient';

interface WishlistState {
  ids: string[];
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  initWishlist: (userId: string) => Promise<void>;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],

      isInWishlist: (productId) => get().ids.includes(productId),

      toggle: async (productId) => {
        const inWishlist = get().isInWishlist(productId);

        // Optimistic UI update first
        set((state) => ({
          ids: inWishlist
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        }));

        // Sync to Supabase if authenticated
        const {
          data: { user },
        } = await supabaseBrowser.auth.getUser();

        if (!user) return; // localStorage-only for anonymous users

        if (inWishlist) {
          await supabaseBrowser
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
        } else {
          await supabaseBrowser
            .from('wishlists')
            .insert({ user_id: user.id, product_id: productId });
        }
      },

      initWishlist: async (userId) => {
        const { data, error } = await supabaseBrowser
          .from('wishlists')
          .select('product_id')
          .eq('user_id', userId);

        if (!error && data) {
          set({ ids: data.map((row) => row.product_id) });
        }
      },

      clearWishlist: () => set({ ids: [] }),
    }),
    { name: 'cosmetics-wishlist' }
  )
);
