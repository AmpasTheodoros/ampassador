import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'el'];
const defaultLocale = 'en';

// Get the preferred locale from the request
function getLocale(request: NextRequest): string {
  // Check if locale is in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const locale = pathname.split('/')[1];
    return locales.includes(locale) ? locale : defaultLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferredLocale && locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If pathname already has a locale, continue
  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect root path to default locale
  if (pathname === '/') {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}`, request.url)
    );
  }

  // Add locale to pathname
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

