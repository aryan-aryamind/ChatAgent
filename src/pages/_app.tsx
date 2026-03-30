import { useRouter } from 'next/router'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AgentCreationProvider } from '@/contexts/AgentCreationContext'
import { AgentsProvider } from '@/contexts/AgentsContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ChatProvider } from '@/contexts/ChatContext'
import { ChatWidget } from '@/app/components/chat-widget/chat-widget'
import '@/styles/index.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  // Hide the platform support widget on embeddable chatbot pages and public views
  const isEmbedPage = router.pathname.startsWith('/chatbot/')
  const isPublicPage = router.pathname.startsWith('/agents/[id]/public') || router.pathname === '/login' || router.pathname === '/signup'
  
  const shouldShowWidget = !isEmbedPage && !isPublicPage

  return (
    <>
      <Head>
        <title>TheChatAgent | Custom AI Support Bots</title>
        <meta name="description" content="Build your custom AI support agent tailored for your business in minutes. Ensure secure, 24/7 instant customer support with TheChatAgent." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthProvider>
          <AgentsProvider>
            <ChatProvider>
              <AgentCreationProvider>
                <Component {...pageProps} />
                <Toaster position="top-right" />
                {shouldShowWidget && <ChatWidget transparent />}
              </AgentCreationProvider>
            </ChatProvider>
          </AgentsProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  )
}
