import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './core/i18n/routing';

const isDev = process.env.NODE_ENV !== 'production';

// In dev mode with single locale, skip middleware for faster compilation
const intlMiddleware = isDev ? null : createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // In development with single locale ('en') and localePrefix: 'never',
  // the middleware isn't needed - just pass through
  if (isDev) {
    return NextResponse.next();
  }

  // In production, run i18n middleware for proper routing
  return intlMiddleware!(request);
}

export const config = {
  // More restrictive matcher - only match actual page routes
  // Excludes: api, _next, _vercel, static files, and common bot endpoints
  matcher: ['/((?!api|_next|_vercel|monitoring|healthcheck|.*\\..*).*)']
};
