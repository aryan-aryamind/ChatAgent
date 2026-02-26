import { createContext, useContext, useState, ReactNode } from 'react'

export interface AgentDetails {
  name: string
  websiteUrl: string
  useCase: string
}

export interface QAPair {
  id: string
  question: string
  answer: string
  intent?: string
}

export interface Source {
  id: string
  type: 'link' | 'file' | 'text' | 'qa' | 'notion'
  name: string
  url?: string
  size?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  qaPairs?: QAPair[]
}

export interface AgentCreationState {
  step: number
  details: AgentDetails | null
  sources: Source[]
  selectedModel: string | null
  responseMode: 'llm' | 'crewai'
  totalSize: string
  tempAgentId?: string | null // Store temporary ID from scraping
  agentId?: string | null // Store the permanent agent ID
}

interface AgentCreationContextType {
  state: AgentCreationState
  setStep: (step: number) => void
  setDetails: (details: AgentDetails) => void
  addSource: (source: Source) => void
  removeSource: (sourceId: string) => void
  clearSources: () => void
  setSelectedModel: (model: string) => void
  setResponseMode: (mode: 'llm' | 'crewai') => void
  updateSourceStatus: (sourceId: string, status: Source['status']) => void
  updateSourceQAPairs: (sourceId: string, qaPairs: QAPair[]) => void
  setTempAgentId: (id: string) => void
  setAgentId: (id: string) => void
  reset: () => void
}

const initialState: AgentCreationState = {
  step: 1,
  details: null,
  sources: [],
  selectedModel: null,
  responseMode: 'llm',
  totalSize: '0 KB',
  tempAgentId: null,
  agentId: null,
}

const AgentCreationContext = createContext<AgentCreationContextType | undefined>(undefined)

export function AgentCreationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AgentCreationState>(initialState)

  const setStep = (step: number) => {
    setState((prev) => ({ ...prev, step }))
  }

  const setDetails = (details: AgentDetails) => {
    setState((prev) => ({ ...prev, details }))
  }

  const addSource = (source: Source) => {
    setState((prev) => ({
      ...prev,
      sources: [...prev.sources, source],
      totalSize: calculateTotalSize([...prev.sources, source]),
    }))
  }

  const removeSource = (sourceId: string) => {
    setState((prev) => {
      const newSources = prev.sources.filter((s) => s.id !== sourceId)
      return {
        ...prev,
        sources: newSources,
        totalSize: calculateTotalSize(newSources),
      }
    })
  }

  const clearSources = () => {
    setState((prev) => ({
      ...prev,
      sources: [],
      totalSize: '0 KB',
    }))
  }

  const setSelectedModel = (model: string) => {
    setState((prev) => ({ ...prev, selectedModel: model }))
  }

  const setResponseMode = (mode: 'llm' | 'crewai') => {
    setState((prev) => ({ ...prev, responseMode: mode }))
  }

  const updateSourceStatus = (sourceId: string, status: Source['status']) => {
    setState((prev) => ({
      ...prev,
      sources: prev.sources.map((s) => (s.id === sourceId ? { ...s, status } : s)),
    }))
  }

  const updateSourceQAPairs = (sourceId: string, qaPairs: QAPair[]) => {
    setState((prev) => ({
      ...prev,
      sources: prev.sources.map((s) => {
        if (s.id === sourceId) {
          // Get base name (remove existing Q&A count if present)
          const baseName = s.name.replace(/\s*\(\d+\s*Q&A\)\s*$/i, '').trim()
          return {
            ...s,
            qaPairs,
            name: s.type === 'link' && qaPairs.length > 0
              ? `${baseName} (${qaPairs.length} Q&A)`
              : baseName || s.name
          }
        }
        return s
      }),
    }))
  }

  const setTempAgentId = (id: string) => {
    setState((prev) => ({ ...prev, tempAgentId: id }))
  }

  const setAgentId = (id: string) => {
    setState((prev) => ({ ...prev, agentId: id }))
  }

  const reset = () => {
    setState(initialState)
  }

  return (
    <AgentCreationContext.Provider
      value={{
        state,
        setStep,
        setDetails,
        addSource,
        removeSource,
        clearSources,
        setSelectedModel,
        setResponseMode,
        updateSourceStatus,
        updateSourceQAPairs,
        setTempAgentId,
        setAgentId,
        reset,
      }}
    >
      {children}
    </AgentCreationContext.Provider>
  )
}

export function useAgentCreation() {
  const context = useContext(AgentCreationContext)
  if (context === undefined) {
    throw new Error('useAgentCreation must be used within an AgentCreationProvider')
  }
  return context
}

function calculateTotalSize(sources: Source[]): string {
  const totalKB = sources.reduce((acc, source) => {
    if (source.size) {
      const size = parseFloat(source.size.replace(' KB', ''))
      return acc + size
    }
    return acc
  }, 0)
  return `${totalKB.toFixed(0)} KB`
}
