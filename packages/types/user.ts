/**
 * User-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

export type UserRole = 'customer' | 'admin';

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

export type Gender = 'male' | 'female' | 'unspecified';

export interface UserAddress {
  country: string;      // Страна (например, "Россия")
  region: string;       // Регион / область (для СДЭК)
  city: string;         // Город
  street: string;       // Улица
  house: string;        // Номер дома
  building?: string;    // Корпус / строение
  apartment?: string;   // Квартира / офис
  zip: string;          // Почтовый индекс
  comment?: string;     // Комментарий курьеру
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  skin_type: SkinType | null;
  default_address: UserAddress | null;
  birth_date: string | null;      // ISO date string: "1990-01-15"
  gender: Gender | null;
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
  default_address?: UserAddress | null;
  birth_date?: string | null;
  gender?: Gender | null;
  created_at?: string;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  skin_type?: SkinType | null;
  default_address?: UserAddress | null;
  birth_date?: string | null;
  gender?: Gender | null;
  updated_at?: string;
}

export interface UserWithOrders extends Profile {
  orders_count: number;
  total_spent: number;
}
