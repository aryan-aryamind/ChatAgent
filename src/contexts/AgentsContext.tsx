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
  status: 'active' | 'disabled'
  conversations?: number
  sources?: number
  qaPairs?: QAPair[]
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
  // Always start with initialAgents to avoid hydration mismatch
  // We'll load from localStorage only on the client side
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load agents from localStorage on mount (client-side only)
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') {
      return
    }

    const loadedAgents = loadAgentsFromStorage()
    setAgents(loadedAgents)
    setIsLoaded(true)
  }, [])

  // Save agents to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      saveAgentsToStorage(agents)
    }
  }, [agents, isLoaded])

  const addAgent = (agent: Agent) => {
    setAgents((prev) => {
      const updated = [...prev, agent]
      saveAgentsToStorage(updated)
      return updated
    })
  }

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents((prev) => {
      const updated = prev.map((agent) => (agent.id === id ? { ...agent, ...updates } : agent))
      saveAgentsToStorage(updated)
      return updated
    })
  }

  const deleteAgent = (id: string) => {
    if (!id) {
      console.error('Cannot delete agent: ID is required')
      return
    }
    
    setAgents((prev) => {
      const agentExists = prev.some((agent) => agent.id === id)
      if (!agentExists) {
        console.warn(`Agent with ID ${id} not found`)
        return prev
      }
      
      const updated = prev.filter((agent) => agent.id !== id)
      saveAgentsToStorage(updated)
      console.log(`Agent ${id} deleted successfully. Remaining agents: ${updated.length}`)
      return updated
    })
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
