"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/app/components/ui/dropdown-menu';
import { MoreVertical, Shield, Eye, EyeOff, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated' || (session && (session.user as any).role !== 'ADMIN')) {
            router.push('/dashboard');
        }
    }, [session, status, router]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/list-agents'); // We need to create this simple list API
            if (response.ok) {
                const data = await response.json();
                setAgents(data);
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
            toast.error('Failed to load agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session && (session.user as any).role === 'ADMIN') {
            fetchAgents();
        }
    }, [session]);

    const handleStatusUpdate = async (agentId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/admin/manage-agent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, status: newStatus }),
            });
            if (response.ok) {
                toast.success(`Agent status set to ${newStatus}`);
                fetchAgents();
            }
        } catch (error) {
            toast.error('Failed to update agent status');
        }
    };

    const toggleVisibility = async (agentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'hidden' ? 'active' : 'hidden';
        try {
            const response = await fetch('/api/admin/manage-agent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, status: newStatus }),
            });
            if (response.ok) {
                toast.success(`Agent ${newStatus === 'hidden' ? 'hidden' : 'visible'}`);
                fetchAgents();
            }
        } catch (error) {
            toast.error('Failed to update agent');
        }
    };

    const extendExpiration = async (agentId: string) => {
        const newExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
        try {
            const response = await fetch('/api/admin/manage-agent', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, expiresAt: newExpiration }),
            });
            if (response.ok) {
                toast.success('Expiration extended by 30 days');
                fetchAgents();
            }
        } catch (error) {
            toast.error('Failed to extend expiration');
        }
    };

    if (status === 'loading' || loading) return <div className="p-8">Loading Admin...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Agent Management</h1>

            <div className="bg-card rounded-xl border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-4 font-semibold text-sm">Agent Name</th>
                            <th className="p-4 font-semibold text-sm">Creator</th>
                            <th className="p-4 font-semibold text-sm">Created At</th>
                            <th className="p-4 font-semibold text-sm">Status</th>
                            <th className="p-4 font-semibold text-sm">Expires At</th>
                            <th className="p-4 font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {agents.map((agent) => (
                            <tr key={agent.id}>
                                <td className="p-4">
                                    <div className="font-medium">{agent.name}</div>
                                    <div className="text-xs text-muted-foreground">{agent.id}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{agent.user?.name || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">{agent.user?.email || 'Unknown'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium">
                                        {format(new Date(agent.createdAt), 'MMM d, yyyy')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(agent.createdAt), 'p')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${agent.status === 'active'
                                        ? 'bg-green-500/10 text-green-500'
                                        : agent.status === 'disabled'
                                            ? 'bg-red-500/10 text-red-500'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {agent.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {agent.expiresAt ? format(new Date(agent.expiresAt), 'PPP p') : 'Unlimited'}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => toggleVisibility(agent.id, agent.status)}>
                                                    {agent.status === 'hidden' ? (
                                                        <><Eye className="mr-2 h-4 w-4" /> Show Agent</>
                                                    ) : (
                                                        <><EyeOff className="mr-2 h-4 w-4" /> Hide Agent</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500 focus:text-red-500"
                                                    onClick={() => handleStatusUpdate(agent.id, agent.status === 'disabled' ? 'active' : 'disabled')}
                                                >
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    {agent.status === 'disabled' ? 'Enable Agent' : 'Disable Agent'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => extendExpiration(agent.id)}>
                                                    <Clock className="mr-2 h-4 w-4" /> +30 Days Expiry
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Chatbot
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
