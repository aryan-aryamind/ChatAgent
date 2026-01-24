# Agent Creation Flow Documentation

## Overview

This document describes the multi-step agent creation flow implemented in the Chatbase Clone project.

## Flow Structure

The agent creation process consists of 4 main steps:

1. **Step 1: Start** (`/agents/new`) - Initial setup with website URL
2. **Step 2: Details** (`/agents/new/details`) - Add training sources (links, files, text, etc.)
3. **Step 3: Sources** (`/agents/new/sources`) - Process and display fetched data
4. **Step 4: Model** (`/agents/new/model`) - Select AI model and configure settings

## State Management

The flow uses React Context API for state management:

- **Context**: `AgentCreationContext` (`src/contexts/AgentCreationContext.tsx`)
- **Provider**: Wrapped in `_app.tsx` to provide state across all pages
- **Hook**: `useAgentCreation()` for accessing state and actions

### State Structure

```typescript
interface AgentCreationState {
  step: number
  details: AgentDetails | null
  sources: Source[]
  selectedModel: string | null
  totalSize: string
}
```

## Page Routes

### 1. `/agents/new` (Step 1: Start)
- **Component**: `AgentCreationStep1`
- **Purpose**: Initial agent setup
- **Features**:
  - Website URL input
  - Use-case selection
  - Option to continue with URL or set up manually
- **Next Step**: Navigates to `/agents/new/details`

### 2. `/agents/new/details` (Step 2: Details)
- **Component**: `AgentCreationStep2`
- **Purpose**: Add training sources
- **Features**:
  - Add multiple source types (File, Text, Links, Q&A, Notion)
  - Modal dialog for adding sources
  - Source summary sidebar
  - Total size calculation
- **Next Step**: Navigates to `/agents/new/sources`

### 3. `/agents/new/sources` (Step 3: Sources)
- **Component**: `AgentCreationStep3`
- **Purpose**: Process and display fetched data
- **Features**:
  - Real-time processing status for each source
  - Visual feedback (loading, completed, error states)
  - Progress tracking
- **Next Step**: Navigates to `/agents/new/model`

### 4. `/agents/new/model` (Step 4: Model)
- **Component**: `AgentCreationStep4`
- **Purpose**: Configure AI model and settings
- **Features**:
  - Model selection (GPT-4, GPT-3.5, GPT-5.1, Claude 3)
  - Temperature slider
  - Instructions/prompt configuration
  - Live preview of chat widget
  - Final agent creation
- **Next Step**: Redirects to `/dashboard` after creation

## Component Structure

All step components are located in:
```
src/app/components/agent-creation/
├── step1-start.tsx
├── step2-details.tsx
├── step3-sources.tsx
└── step4-model.tsx
```

## Import Aliases

All imports use the `@` alias configured in `tsconfig.json`:

```typescript
// Instead of: import { Button } from '../../components/ui/button'
// Use: import { Button } from '@/app/components/ui/button'
```

## Usage

### Starting the Flow

From the dashboard, click "Create New Agent" or "New AI agent" button:

```typescript
const handleCreateAgent = () => {
  router.push('/agents/new')
}
```

### Navigation Between Steps

Each step component handles navigation using Next.js router:

```typescript
import { useRouter } from 'next/router'
import { useAgentCreation } from '@/contexts/AgentCreationContext'

const router = useRouter()
const { setStep } = useAgentCreation()

// Navigate to next step
setStep(2)
router.push('/agents/new/details')
```

### Accessing State

Use the `useAgentCreation` hook in any component:

```typescript
import { useAgentCreation } from '@/contexts/AgentCreationContext'

const { state, addSource, setDetails } = useAgentCreation()

// Access state
console.log(state.sources)
console.log(state.details)

// Update state
addSource(newSource)
setDetails(agentDetails)
```

## Data Flow

1. **User enters website URL** → Saved to `state.details`
2. **User adds sources** → Added to `state.sources` array
3. **Sources are processed** → Status updated in `state.sources`
4. **User selects model** → Saved to `state.selectedModel`
5. **Agent is created** → State is reset, redirect to dashboard

## Features

### Source Management
- Add multiple sources of different types
- Track source status (pending, processing, completed, error)
- Calculate total size
- Remove sources

### Model Selection
- Multiple AI models available
- Temperature control for creativity
- Custom instructions/prompts
- Live preview

### State Persistence
- State persists across page navigation
- Automatically resets after agent creation
- Can be extended to use localStorage for persistence

## Future Enhancements

1. **API Integration**: Connect to actual backend APIs
2. **Persistence**: Save state to localStorage or database
3. **Validation**: Add form validation for each step
4. **Error Handling**: Better error messages and recovery
5. **Progress Indicator**: Show overall progress through steps
6. **Back Navigation**: Allow going back to previous steps

## Notes

- All components use TypeScript for type safety
- Toast notifications are used for user feedback (via `sonner`)
- The flow is fully responsive and works on mobile devices
- All imports use the `@` alias for cleaner code
