import { Suspense } from 'react'
import { Providers } from './providers'
import { GoogleAnalytics, AppRouterPageView } from '@/app/components/analytics'
import '@/styles/index.css'

export const metadata = {
  title: 'Dashboard',
  description: 'Manage your chatbots',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <AppRouterPageView />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
