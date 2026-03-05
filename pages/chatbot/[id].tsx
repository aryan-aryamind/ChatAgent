import { useRouter } from 'next/router';
import { StandaloneChat } from '@/app/components/chatbot/standalone-chat';
import { useAgents } from '@/contexts/AgentsContext';
import Head from 'next/head';

export default function ChatbotEmbedPage() {
    const router = useRouter();
    const { id } = router.query;
    const { getAgent } = useAgents();

    // In a real app, you'd fetch this from the API if not found in context
    // or use getServerSideProps for SEO/initial load
    const agentId = id as string;
    const agent = agentId ? getAgent(agentId) : null;

    if (!id) return null;

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
        <>
            <Head>
                <title>{agent?.name || 'Chatbot'} | Powered by Chatbase</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
            <StandaloneChat
                agentId={agentId}
                agentName={agent?.name || 'Assistant'}
            />
        </>
    );
}
