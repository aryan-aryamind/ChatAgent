import { Providers } from './providers'
import '@/styles/index.css'

export const metadata = {
  title: 'Admin Dashboard',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
