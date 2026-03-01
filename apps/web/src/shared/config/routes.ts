/**
 * Typed route constants
 * Centralized route definitions for type safety
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  CATALOG: '/catalog',
  PRODUCT: (slug: string) => `/product/${slug}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  QUIZ: '/quiz',

  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // User routes
  PROFILE: '/profile',
  ORDERS: '/profile/orders',
  WISHLIST: '/profile/wishlist',
  SETTINGS: '/profile/settings',

  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    PRODUCT_CREATE: '/admin/products/create',
    PRODUCT_EDIT: (id: string) => `/admin/products/${id}/edit`,
    ORDERS: '/admin/orders',
    ORDER_DETAIL: (id: string) => `/admin/orders/${id}`,
    ANALYTICS: '/admin/analytics',
    PROMO_CODES: '/admin/promo-codes',
    BRANDS: '/admin/brands',
    CATEGORIES: '/admin/categories',
  },

  // API routes
  API: {
    YOOKASSA_WEBHOOK: '/api/yookassa/webhook',
    REVALIDATE: '/api/revalidate',
  },
} as const;

// Type for route keys
export type RouteKey = keyof typeof ROUTES;

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  ROUTES.CHECKOUT,
  ROUTES.PROFILE,
  ROUTES.ORDERS,
  ROUTES.WISHLIST,
  ROUTES.SETTINGS,
];

// Admin routes that require admin role
export const ADMIN_ROUTES = [
  ROUTES.ADMIN.DASHBOARD,
  ROUTES.ADMIN.PRODUCTS,
  ROUTES.ADMIN.ORDERS,
  ROUTES.ADMIN.ANALYTICS,
  ROUTES.ADMIN.PROMO_CODES,
  ROUTES.ADMIN.BRANDS,
  ROUTES.ADMIN.CATEGORIES,
];

// Auth routes (redirect to home if already logged in)
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

// Generate metadata for pages
export const PAGE_METADATA = {
  HOME: {
    title: 'K-Beauty & European Cosmetics | Premium Skincare Store',
    description: 'Premium Korean and European cosmetics in Russia. Authentic K-beauty products and luxury European skincare brands.',
  },
  CATALOG: {
    title: 'Каталог | K-Beauty & European Cosmetics',
    description: 'Browse our collection of premium Korean and European skincare products.',
  },
  CART: {
    title: 'Корзина | K-Beauty & European Cosmetics',
    description: 'Review your cart and proceed to checkout.',
  },
  CHECKOUT: {
    title: 'Оформление заказа | K-Beauty & European Cosmetics',
    description: 'Complete your purchase securely.',
  },
  QUIZ: {
    title: 'Определение типа кожи | K-Beauty & European Cosmetics',
    description: 'Take our quiz to discover your skin type and get personalized product recommendations.',
  },
  LOGIN: {
    title: 'Вход | K-Beauty & European Cosmetics',
    description: 'Sign in to your account.',
  },
  REGISTER: {
    title: 'Регистрация | K-Beauty & European Cosmetics',
    description: 'Create a new account.',
  },
  PROFILE: {
    title: 'Личный кабинет | K-Beauty & European Cosmetics',
    description: 'Manage your account and orders.',
  },
} as const;
