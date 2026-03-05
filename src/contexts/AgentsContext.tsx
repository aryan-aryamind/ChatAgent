"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  responseMode?: 'llm' | 'crewai'
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  lastTrained?: string
  status: 'active' | 'disabled' | 'hidden'
  conversations?: number
  sources?: number
  qaPairs?: QAPair[]
  expiresAt?: string | null
  crewaiSettings?: {
    intentConfidence: number
  }
}

interface AgentsContextType {
  agents: Agent[]
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  getAgent: (id: string) => Agent | undefined
}

const AgentsContext = createContext<AgentsContextType | undefined>(undefined)

// Storage key for localStorage
const STORAGE_KEY = 'chatbase_agents'

// Mock initial agents (fallback if localStorage is empty)
const initialAgents: Agent[] = [
  {
    id: '1',
    name: 'Shweta Technologies',
    status: 'active',
    lastTrained: '4 days ago',
    conversations: 0,
    sources: 39,
  },
]

// Load agents from localStorage
function loadAgentsFromStorage(): Agent[] {
  if (typeof window === 'undefined') {
    return initialAgents
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that it's an array
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Error loading agents from localStorage:', error)
  }

  // If no stored data or error, return initial agents and save them
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAgents))
    } catch (error) {
      console.error('Error saving initial agents to localStorage:', error)
    }
  }

  return initialAgents
}

// Save agents to localStorage
function saveAgentsToStorage(agents: Agent[]) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents))
  } catch (error) {
    console.error('Error saving agents to localStorage:', error)
  }
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Load from DB on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/agents/list')
        if (response.ok) {
          const dbAgents = await response.json()
          setAgents(dbAgents)

          // Trigger one-time local sync if needed
          const localAgents = loadAgentsFromStorage()
          const unsynced = localAgents.filter(local =>
            !dbAgents.some((db: any) => db.id === local.id || db.name === local.name) &&
            local.id !== '1' // Skip mock
          )

          if (unsynced.length > 0) {
            syncLocalToDb(unsynced)
          }
        }
      } catch (error) {
        console.error('Error fetching db agents:', error)
        // Fallback to local
        setAgents(loadAgentsFromStorage())
      } finally {
        setIsLoaded(true)
      }
    }

    fetchAgents()
  }, [])

  const syncLocalToDb = async (localAgents: Agent[]) => {
    setIsSyncing(true)
    console.log(`Syncing ${localAgents.length} local agents to database...`)

    for (const agent of localAgents) {
      try {
        await fetch('/api/agents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...agent, status: agent.status || 'active' }),
        })
      } catch (e) {
        console.error('Failed to sync agent:', agent.name, e)
      }
    }

    // Clear local storage legacy data after attempt
    localStorage.removeItem(STORAGE_KEY)

    // Refresh list
    const response = await fetch('/api/agents/list')
    if (response.ok) {
      setAgents(await response.json())
    }
    setIsSyncing(false)
  }

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

    // Optimistic update
    setAgents(prev => prev.filter(a => a.id !== id))

    try {
      await fetch(`/api/admin/manage-agent?agentId=${id}`, {
        method: 'DELETE',
      })
    } catch (e) {
      // If not admin, try user delete endpoint (if we have one, otherwise fallback)
      console.error('Delete failed, might need user-specific delete endpoint:', e)
    }
  }

  const getAgent = (id: string) => {
    return agents.find((agent) => agent.id === id)
  }

  return (
    <AgentsContext.Provider
      value={{
        agents,
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
