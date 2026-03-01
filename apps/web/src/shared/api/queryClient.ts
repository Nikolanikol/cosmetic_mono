/**
 * TanStack Query client configuration
 * For server state management
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Default stale time for queries
const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 5 minutes

// Default cache time for queries
const DEFAULT_GC_TIME = 1000 * 60 * 30; // 30 minutes

// Create a new QueryClient instance
export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.showError !== false) {
          console.error('Query error:', error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        if (mutation.meta?.showError !== false) {
          console.error('Mutation error:', error);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Query keys for type-safe caching
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: (filters?: Record<string, unknown>) =>
      [...queryKeys.products.all, 'list', filters] as const,
    details: (slug: string) => [...queryKeys.products.all, 'detail', slug] as const,
    byCategory: (categorySlug: string) =>
      [...queryKeys.products.all, 'category', categorySlug] as const,
    byBrand: (brandSlug: string) =>
      [...queryKeys.products.all, 'brand', brandSlug] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
    related: (productId: string) =>
      [...queryKeys.products.all, 'related', productId] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
    detail: (slug: string) => [...queryKeys.categories.all, 'detail', slug] as const,
  },

  // Brands
  brands: {
    all: ['brands'] as const,
    lists: () => [...queryKeys.brands.all, 'list'] as const,
    featured: () => [...queryKeys.brands.all, 'featured'] as const,
    detail: (slug: string) => [...queryKeys.brands.all, 'detail', slug] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    detail: () => [...queryKeys.cart.all, 'detail'] as const,
    items: () => [...queryKeys.cart.all, 'items'] as const,
    count: () => [...queryKeys.cart.all, 'count'] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.all, 'list', filters] as const,
    detail: (orderId: string) => [...queryKeys.orders.all, 'detail', orderId] as const,
    summary: () => [...queryKeys.orders.all, 'summary'] as const,
  },

  // User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    orders: () => [...queryKeys.user.all, 'orders'] as const,
    wishlist: () => [...queryKeys.user.all, 'wishlist'] as const,
    addresses: () => [...queryKeys.user.all, 'addresses'] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    byProduct: (productId: string) =>
      [...queryKeys.reviews.all, 'product', productId] as const,
    summary: (productId: string) =>
      [...queryKeys.reviews.all, 'summary', productId] as const,
    byUser: (userId: string) => [...queryKeys.reviews.all, 'user', userId] as const,
  },

  // Quiz
  quiz: {
    all: ['quiz'] as const,
    questions: () => [...queryKeys.quiz.all, 'questions'] as const,
    result: (sessionId?: string) =>
      [...queryKeys.quiz.all, 'result', sessionId] as const,
    recommendations: (skinType: string) =>
      [...queryKeys.quiz.all, 'recommendations', skinType] as const,
  },

  // Promo codes
  promoCodes: {
    all: ['promoCodes'] as const,
    validate: (code: string) => [...queryKeys.promoCodes.all, 'validate', code] as const,
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    analytics: (period?: string) =>
      [...queryKeys.admin.all, 'analytics', period] as const,
    users: (filters?: Record<string, unknown>) =>
      [...queryKeys.admin.all, 'users', filters] as const,
  },
} as const;

// Re-export QueryClient type
export type { QueryClient };
