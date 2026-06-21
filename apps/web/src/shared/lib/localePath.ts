import { defaultLocale, type Locale } from '@/shared/config/i18n';

export function localePath(path: string, locale: Locale = defaultLocale): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${clean === '/' ? '' : clean}`;
}
