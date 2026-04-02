import Head from 'next/head'
import Link from 'next/link'

export default function ChatbotIndexPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 text-center antialiased font-sans">
            <Head>
                <title>Chatbot Configuration | TheChatAgent</title>
            </Head>
            
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Missing Agent ID
                    </h1>
                    
                    <p className="text-zinc-400 leading-relaxed">
                        To view your chatbot, you need to include an Agent ID in the URL.
                    </p>
                    
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">1</div>
                             <span>Go to your Dashboard</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">2</div>
                             <span>Select an Agent and click "Integrations"</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                             <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">3</div>
                             <span>Copy the Chatbot share link or ID</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Link 
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                        Back to Dashboard
                    </Link>
                    <Link 
                        href="/"
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Learn more about TheChatAgent
                    </Link>
                </div>
            </div>
        </div>
    )
}
