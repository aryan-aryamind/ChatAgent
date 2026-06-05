'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isGAEnabled, pageview } from '@/lib/analytics/gtag';

/**
 * Tracks initial and client-side page views for Pages Router routes.
 * router.events.routeChangeComplete covers SPA navigation, dynamic routes,
 * and query parameter changes (asPath includes the query string).
 */
export function PagesRouterPageView() {
  const router = useRouter();

  useEffect(() => {
    if (!isGAEnabled()) return;

    const handleRouteChange = (url: string) => {
      pageview(url);
    };

    pageview(router.asPath);

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return null;
}
