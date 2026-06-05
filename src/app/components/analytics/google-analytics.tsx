import Script from 'next/script';
import { GA_MEASUREMENT_ID, isGAEnabled } from '@/lib/analytics/gtag';

/**
 * Loads the GA4 gtag.js script. Safe to render from Server Components.
 * send_page_view is disabled; route trackers emit page_view events manually.
 */
export function GoogleAnalytics() {
  if (!isGAEnabled()) return null;

  const measurementId = GA_MEASUREMENT_ID as string;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
