import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'el'];
const defaultLocale = 'en';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/api/webhooks(.*)', // Webhooks are public but should use secret verification
  '/public(.*)', // Public intake forms and other public pages
]);

// Define protected routes that require authentication AND organization
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/api/dashboard(.*)',
]);

// Get the preferred locale from the request
function getLocale(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const locale = pathname.split('/')[1];
    return locales.includes(locale) ? locale : defaultLocale;
  }

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferredLocale && locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }

  return defaultLocale;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Skip i18n middleware for static files and API routes (except locale handling)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    (pathname.includes('.') && !pathname.startsWith('/api'))
  ) {
    return NextResponse.next();
  }

  // Handle locale routing for non-API routes
  if (!pathname.startsWith('/api')) {
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // If pathname already has a locale, continue with auth check
    if (pathnameHasLocale) {
      // Check if route is protected
      if (isProtectedRoute(request)) {
        const { userId, orgId } = await auth();
        
        if (!userId) {
          const locale = pathname.split('/')[1];
          const signInUrl = new URL(`/${locale}/sign-in`, request.url);
          signInUrl.searchParams.set('redirect_url', pathname);
          return NextResponse.redirect(signInUrl);
        }

        if (!orgId) {
          const locale = pathname.split('/')[1];
          // Redirect to organization selection or creation
          const orgUrl = new URL(`/${locale}/select-org`, request.url);
          orgUrl.searchParams.set('redirect_url', pathname);
          return NextResponse.redirect(orgUrl);
        }
      }

      return NextResponse.next();
    }

    // Redirect root path to default locale
    if (pathname === '/') {
      const locale = getLocale(request);
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // Skip locale routing for public routes
    if (pathname.startsWith('/public/')) {
      return NextResponse.next();
    }

    // Handle dashboard routes - redirect explicitly for cleaner URLs
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      const locale = getLocale(request);
      const newPath = pathname.replace('/dashboard', `/${locale}/dashboard`);
      return NextResponse.redirect(new URL(newPath, request.url));
    }

    // Add locale to pathname for other routes
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // For API routes, auth is handled in the route handlers themselves
  // (using requireOrgId() from lib/auth.ts)
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are handled but not rewritten
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
