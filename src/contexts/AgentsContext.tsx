"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export interface QAPair {
  id: string
  question: string
  answer: string
  intent?: string
  confidence?: number
}

export interface Agent {
  id: string
  name: string
  websiteUrl?: string
  useCase?: string
  status: 'active' | 'disabled' | 'hidden'
  conversations?: number
  sources?: number
  qaPairs?: QAPair[]
  image?: string
  expiresAt?: string | null
  initialMessage?: string
  responseMode?: 'llm' | 'crewai'
}

interface AgentsContextType {
  agents: Agent[]
  isLoaded: boolean
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  getAgent: (id: string) => Agent | undefined
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined)

export function AgentsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Load from DB when authenticated
  useEffect(() => {
    const fetchAgents = async () => {
      // If unauthenticated, clear agents and mark as loaded
      if (status === 'unauthenticated') {
        setAgents([])
        setIsLoaded(true)
        return
      }

      // If still loading session, don't fetch yet
      if (status === 'loading') {
        return
      }

      // If authenticated, fetch from DB
      if (status === 'authenticated') {
        try {
          setIsLoaded(false)
          const response = await fetch('/api/agents/list')
          if (response.ok) {
            const dbAgents = await response.json()
            setAgents(dbAgents)

            // Legacy cleanup: clear any old local storage data once successfully loaded from DB
            if (typeof window !== 'undefined') {
              localStorage.removeItem('thechatagent_agents')
            }
          }
        } catch (error) {
          console.error('Error fetching db agents:', error)
        } finally {
          setIsLoaded(true)
        }
      }
    }

    fetchAgents()
  }, [session, status])

  const addAgent = async (agent: Agent) => {
    // Note: step4-model.tsx now calls /api/agents/create directly
    // This local state update is for immediate UI feedback
    setAgents(prev => [...prev, agent])
  }

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    // Optimistic update
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))

    try {
      await fetch(`/api/agents/update-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: id, details: updates }),
      })
    } catch (e) {
      console.error('Failed to update agent in DB:', e)
    }
  }

  const deleteAgent = async (id: string) => {
    if (!id) return
    
    // Save current state for potential rollback
    const previousAgents = [...agents];
    
    // Optimistic update
    setAgents(prev => prev.filter(a => a.id !== id))

    try {
      // 1. Try Admin delete first
      let response = await fetch(`/api/admin/manage-agent?agentId=${id}`, {
        method: 'DELETE',
      })

      // 2. Fallback to user-specific delete if admin failed (e.g. 403 Forbidden)
      if (!response.ok) {
        console.log('Admin delete failed or unauthorized, trying user-specific delete...')
        response = await fetch(`/api/agents/${id}/delete`, {
          method: 'DELETE',
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Final deletion failed:', errorData.error || response.statusText)
        
        // Revert optimistic update
        setAgents(previousAgents);
        throw new Error(errorData.error || 'Failed to delete agent');
      }
    } catch (e: any) {
      console.error('Delete failed:', e);
      // Revert if not already caught
      setAgents(previousAgents);
      throw e;
    } finally {
      // FORCE CLEANUP of Radix/Headless UI body locks
      // This fixes the "unresponsive UI" bug where backdrops/pointer-events: none get stuck
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
          // Find and remove any leftover overlays if they exist
          const leftoverOverlays = document.querySelectorAll('[data-slot="alert-dialog-overlay"]');
          leftoverOverlays.forEach(el => (el as HTMLElement).style.display = 'none');
        }, 300);
      }
    }
  }

  const getAgent = (id: string) => {
    return agents.find((agent) => agent.id === id)
  }

  return (
    <AgentsContext.Provider
      value={{
        agents,
        isLoaded,
        addAgent,
        updateAgent,
        deleteAgent,
        getAgent,
      }}
    >
      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-primary text-white p-4 rounded-lg shadow-lg z-[9999] animate-bounce">
          Syncing your agents to database...
        </div>
      )}
      {children}
    </AgentsContext.Provider>
  )
}

export function useAgents() {
  const context = useContext(AgentsContext)
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider')
  }
  return context
}
