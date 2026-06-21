import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, isValidLocale } from '@/shared/config/i18n';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API, admin, static assets, auth callback
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract locale from first segment
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];

  // Redirect root or unknown locale → /en/...
  if (!maybeLocale || !isValidLocale(maybeLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // --- Supabase auth session refresh ---
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Strip locale prefix for route matching
  const pathWithoutLocale = '/' + segments.slice(1).join('/');

  // Protect profile and checkout routes
  if (
    pathWithoutLocale.startsWith('/profile') ||
    pathWithoutLocale.startsWith('/checkout')
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${maybeLocale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
