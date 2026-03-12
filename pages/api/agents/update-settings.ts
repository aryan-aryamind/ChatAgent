import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { agentId, details } = req.body
        console.log('Update Settings Request:', { agentId, details });

        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' })
        }

        // 1. Update Prisma Database
        // Map details fields to Prisma model fields if necessary
        const prismaUpdateData: any = {
            ...(details.name && { name: details.name }),
            ...(details.useCase && { useCase: details.useCase }),
            ...(details.status && { status: details.status }),
            ...(details.initialMessage !== undefined && { initialMessage: details.initialMessage }),
        }

        const updatedAgent = await prisma.agent.update({
            where: { id: agentId },
            data: prismaUpdateData,
        })

        // 2. Sync with Python Backend (CrewAI Service)
        // Consolidate all instructions into useCase
        const agentInstructions = details.useCase || updatedAgent.useCase || 'general'

        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'

        try {
            const pythonResponse = await fetch(`${crewaiServiceUrl}/update-agent-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent_id: agentId,
                    persona_type: agentInstructions,
                    system_prompt: agentInstructions,
                }),
            })

            if (!pythonResponse.ok) {
                const errorText = await pythonResponse.text()
                console.error('Python backend update failed:', errorText)
                // We still return 200 because DB was updated, but log the error
            }
        } catch (backendError) {
            console.error('Failed to connect to Python backend:', backendError)
        }

        return res.status(200).json({ 
            success: true, 
            agent: updatedAgent 
        })

    } catch (error: any) {
        console.error('Error updating agent settings:', error)
        return res.status(500).json({ error: 'Failed to update agent settings', details: error.message })
    }
}
