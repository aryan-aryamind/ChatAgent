"use client";

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { AgentsProvider } from '@/contexts/AgentsContext'
import { AgentCreationProvider } from '@/contexts/AgentCreationContext'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
                <AgentsProvider>
                    <AgentCreationProvider>
                        {children}
                        <Toaster position="top-right" />
                    </AgentCreationProvider>
                </AgentsProvider>
            </AuthProvider>
        </ThemeProvider>
    )
}
