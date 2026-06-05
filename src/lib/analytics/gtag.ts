/**
 * Google Analytics 4 (GA4) utilities.
 * Measurement ID is read from NEXT_PUBLIC_GA_MEASUREMENT_ID at build time.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const isGAEnabled = (): boolean =>
  typeof GA_MEASUREMENT_ID === 'string' && GA_MEASUREMENT_ID.length > 0;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFunction;
  }
}

type GtagCommand = 'config' | 'event' | 'js' | 'set';
type GtagFunction = (
  command: GtagCommand,
  targetOrAction: string | Date,
  params?: Record<string, unknown>
) => void;

/** Dedupe rapid duplicate pageviews (e.g. React Strict Mode double-mount in dev). */
let lastPageview: { url: string; at: number } | null = null;
const DEDUPE_WINDOW_MS = 500;

function shouldSkipDuplicatePageview(url: string): boolean {
  const now = Date.now();
  if (
    lastPageview &&
    lastPageview.url === url &&
    now - lastPageview.at < DEDUPE_WINDOW_MS
  ) {
    return true;
  }
  lastPageview = { url, at: now };
  return false;
}

function getGtag(): GtagFunction | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.gtag;
}

/**
 * Build a canonical page path including query string when present.
 */
export function buildPagePath(pathname: string, searchParams?: URLSearchParams | null): string {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Track a GA4 page_view event. Uses manual events because gtag config has
 * send_page_view disabled to prevent duplicate hits on SPA navigations.
 */
export function pageview(url: string): void {
  if (!isGAEnabled() || typeof window === 'undefined') return;
  if (shouldSkipDuplicatePageview(url)) return;

  const gtag = getGtag();
  if (!gtag) return;

  const pageLocation = url.startsWith('http')
    ? url
    : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;

  gtag('event', 'page_view', {
    page_path: url,
    page_location: pageLocation,
    page_title: document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/**
 * Track a custom GA4 event.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (!isGAEnabled() || typeof window === 'undefined') return;

  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', eventName, params);
}
