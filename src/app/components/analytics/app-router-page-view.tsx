'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { buildPagePath, isGAEnabled, pageview } from '@/lib/analytics/gtag';

/**
 * Tracks page views for App Router navigations (pathname + query changes).
 * Must be wrapped in <Suspense> because useSearchParams() opts into client rendering.
 */
export function AppRouterPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isGAEnabled() || !pathname) return;
    pageview(buildPagePath(pathname, searchParams));
  }, [pathname, searchParams]);

  return null;
}
