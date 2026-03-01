/**
 * Supabase Database Types
 * Manually maintained to match supabase/migrations/000001_initial_schema.sql
 * + subsequent ALTER TABLE migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: 'customer' | 'admin';
          skin_type: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | null;
          default_address: Json | null;
          birth_date: string | null;
          gender: 'male' | 'female' | 'unspecified' | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'admin';
          skin_type?: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | null;
          default_address?: Json | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'unspecified' | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'customer' | 'admin';
          skin_type?: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | null;
          default_address?: Json | null;
          birth_date?: string | null;
          gender?: 'male' | 'female' | 'unspecified' | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          origin_country: string;
          logo_url: string | null;
          description: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          origin_country: string;
          logo_url?: string | null;
          description?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          origin_country?: string;
          logo_url?: string | null;
          description?: string | null;
          is_featured?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_ru: string;
          name_en: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_ru: string;
          name_en: string;
          slug: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name_ru?: string;
          name_en?: string;
          slug?: string;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name_ru: string;
          name_en: string;
          slug: string;
          description_ru: string | null;
          category_id: string;
          brand_id: string;
          is_active: boolean;
          is_featured: boolean;
          routine_step: number | null;
          skin_types: string[];
          tags: string[];
          meta_title_ru: string | null;
          meta_description_ru: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name_ru: string;
          name_en: string;
          slug: string;
          description_ru?: string | null;
          category_id: string;
          brand_id: string;
          is_active?: boolean;
          is_featured?: boolean;
          routine_step?: number | null;
          skin_types?: string[];
          tags?: string[];
          meta_title_ru?: string | null;
          meta_description_ru?: string | null;
          created_at?: string;
        };
        Update: {
          name_ru?: string;
          name_en?: string;
          slug?: string;
          description_ru?: string | null;
          category_id?: string;
          brand_id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          routine_step?: number | null;
          skin_types?: string[];
          tags?: string[];
          meta_title_ru?: string | null;
          meta_description_ru?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_brand_id_fkey';
            columns: ['brand_id'];
            isOneToOne: false;
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          name_ru: string;
          price_rub: number;
          sale_price_rub: number | null;
          stock: number;
          attributes: Json;
          weight_g: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          name_ru: string;
          price_rub: number;
          sale_price_rub?: number | null;
          stock?: number;
          attributes?: Json;
          weight_g?: number | null;
          created_at?: string;
        };
        Update: {
          sku?: string;
          name_ru?: string;
          price_rub?: number;
          sale_price_rub?: number | null;
          stock?: number;
          attributes?: Json;
          weight_g?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_ru: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_ru?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          url?: string;
          alt_ru?: string | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_ingredients: {
        Row: {
          id: string;
          product_id: string;
          inci_name: string;
          name_ru: string;
          purpose_ru: string | null;
          is_highlighted: boolean;
          safety_rating: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          inci_name: string;
          name_ru: string;
          purpose_ru?: string | null;
          is_highlighted?: boolean;
          safety_rating?: number | null;
          created_at?: string;
        };
        Update: {
          inci_name?: string;
          name_ru?: string;
          purpose_ru?: string | null;
          is_highlighted?: boolean;
          safety_rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_ingredients_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          variant_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'wishlists_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: string;
          total_rub: number;
          promo_code_id: string | null;
          discount_rub: number;
          delivery_cost_rub: number;
          yookassa_payment_id: string | null;
          yookassa_payment_url: string | null;
          shipping_address: Json | null;
          shipping_method: string | null;
          tracking_number: string | null;
          created_at: string;
          updated_at: string | null;
          paid_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status?: string;
          total_rub: number;
          promo_code_id?: string | null;
          discount_rub?: number;
          delivery_cost_rub?: number;
          yookassa_payment_id?: string | null;
          yookassa_payment_url?: string | null;
          shipping_address?: Json | null;
          shipping_method?: string | null;
          tracking_number?: string | null;
          created_at?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          status?: string;
          total_rub?: number;
          promo_code_id?: string | null;
          discount_rub?: number;
          delivery_cost_rub?: number;
          yookassa_payment_id?: string | null;
          yookassa_payment_url?: string | null;
          shipping_address?: Json | null;
          shipping_method?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          price_rub_at_purchase: number;
          product_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          quantity: number;
          price_rub_at_purchase: number;
          product_snapshot: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          skin_type: string | null;
          is_verified_purchase: boolean;
          helpful_count: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          skin_type?: string | null;
          is_verified_purchase?: boolean;
          helpful_count?: number;
          created_at?: string;
        };
        Update: {
          rating?: number;
          title?: string | null;
          body?: string | null;
          skin_type?: string | null;
          helpful_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: string;
          discount_value: number;
          min_order_rub: number | null;
          usage_limit: number | null;
          used_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: string;
          discount_value: number;
          min_order_rub?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          discount_type?: string;
          discount_value?: number;
          min_order_rub?: number | null;
          usage_limit?: number | null;
          used_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_results: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          answers: Json;
          skin_type_result: string;
          recommended_product_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          answers: Json;
          skin_type_result: string;
          recommended_product_ids: string[];
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_promo_code_usage: {
        Args: { promo_code_id: string };
        Returns: void;
      };
      increment_review_helpful: {
        Args: { review_id: string };
        Returns: void;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
