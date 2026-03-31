import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

        // === HEALTH CHECK: block agent creation if LLM service is down ===
        try {
            const healthRes = await fetch(`${crewaiServiceUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(180000) })
            if (!healthRes.ok) throw new Error('unhealthy')
        } catch {
            console.error('❌ CrewAI backend offline — blocking agent creation')
            return res.status(503).json({
                error: 'AI backend service is currently offline.',
                message: 'The AI service must be running to create an agent. Please start the backend and try again.',
                code: 'SERVICE_OFFLINE',
            })
        }

        const {
            name,
            websiteUrl,
            useCase,
            status,
            conversations,
            sources,
            qaPairs,
            expiresAt,
            image,
            initialMessage
        } = req.body

        const agent = await prisma.agent.create({
            data: {
                userId: (session.user as any).id,
                name,
                websiteUrl,
                useCase,
                status: status || 'active',
                conversations: conversations || 0,
                sources: sources || 0,
                qaPairs,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                image,
                initialMessage
            } as any
        })

        return res.status(201).json(agent)
    } catch (error: any) {
        console.error('Error creating agent:', error)
        return res.status(500).json({ error: 'Failed to create agent', details: error.message })
    }
}
