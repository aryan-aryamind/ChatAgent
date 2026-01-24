import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AgentCreationProvider } from '@/contexts/AgentCreationContext'
import { AgentsProvider } from '@/contexts/AgentsContext'
import { AuthProvider } from '@/contexts/AuthContext'
import '@/styles/index.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <AgentsProvider>
          <AgentCreationProvider>
            <Component {...pageProps} />
            <Toaster position="top-right" />
          </AgentCreationProvider>
        </AgentsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
