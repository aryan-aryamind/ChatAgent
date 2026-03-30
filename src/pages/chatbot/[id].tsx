import { useRouter } from 'next/router';
import { StandaloneChat } from '@/app/components/chatbot/standalone-chat';
import { ChatWidget } from '@/app/components/chat-widget/chat-widget';
import { useAgents } from '@/contexts/AgentsContext';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { cn } from '../../app/components/ui/utils';

export default function ChatbotEmbedPage() {
    const router = useRouter();
    const { id } = router.query;
    const { getAgent } = useAgents();
    const [publicAgent, setPublicAgent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const agentId = id as string;
    const contextAgent = agentId ? getAgent(agentId) : null;
    const isWidgetView = router.query.view === 'widget';

    useEffect(() => {
        if (isWidgetView) {
            // High-priority transparency enforcement
            const forceTransparency = () => {
                document.documentElement.classList.add('widget-mode');
                document.body.classList.add('widget-mode');
                
                const targets = [document.documentElement, document.body, document.getElementById('__next')];
                targets.forEach(el => {
                    if (el) {
                        el.style.backgroundColor = 'transparent';
                        el.style.backgroundImage = 'none';
                        el.style.setProperty('background-color', 'transparent', 'important');
                        el.style.setProperty('background-image', 'none', 'important');
                    }
                });
            };

            forceTransparency();
            // Run again after a short delay to catch the theme manager's initialization
            const timer = setTimeout(forceTransparency, 100);
            return () => clearTimeout(timer);
        }
    }, [isWidgetView]);

    useEffect(() => {
        if (!agentId) return;

        // If we have it in context (logged in user), no need to fetch public info
        if (contextAgent) {
            setIsLoading(false);
            setError(null);
            return;
        }

        const fetchPublicAgent = async () => {
            try {
                const response = await fetch(`/api/agents/${agentId}/public`);
                if (response.ok) {
                    const data = await response.json();
                    setPublicAgent(data);
                    setError(null);
                } else if (response.status === 404) {
                    setError('Agent not found');
                } else {
                    setError('Failed to load agent');
                }
            } catch (error) {
                console.error('Error fetching public agent info:', error);
                setError('An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicAgent();
    }, [agentId, contextAgent, isWidgetView]);

    if (!id || (isLoading && !contextAgent)) return null;

    if (error === 'Agent not found') {
        return (
            <div className="h-screen flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <h2 className="text-2xl font-bold text-red-500">Agent Not Found</h2>
                    <p className="text-muted-foreground">
                        The chatbot with ID <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">{agentId}</code> was not found or has been deleted.
                    </p>
                </div>
            </div>
        );
    }

    const agent = contextAgent || publicAgent;

    if (agent && (agent.status === 'hidden' || agent.status === 'disabled')) {
        return (
            <div className="h-screen flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <h2 className="text-2xl font-bold">Chatbot Unavailable</h2>
                    <p className="text-muted-foreground">
                        This chatbot has been disabled or hidden by the administrator.
                        It is no longer accepting new messages.
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div 
            className={isWidgetView ? 'bg-transparent overflow-visible' : 'min-h-screen bg-background'}
            style={isWidgetView ? { backgroundColor: 'transparent' } : {}}
        >
            <Head>
                <title>{agent?.name || 'Chatbot'} | Powered by AI Agent</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
            {isWidgetView ? (
                <ChatWidget
                    agentId={agentId}
                    transparent={true}
                    defaultOpen={router.query.open === 'true'}
                />
            ) : (
                <StandaloneChat
                    agentId={agentId}
                    agentName={agent?.name || 'Assistant'}
                    initialMessage={agent?.initialMessage}
                    transparent={isWidgetView}
                />
            )}
        </div>
    );
}
