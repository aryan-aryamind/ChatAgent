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
        const {
            name,
            websiteUrl,
            useCase,
            responseMode,
            model,
            temperature,
            maxTokens,
            systemPrompt,
            lastTrained,
            status,
            conversations,
            sources,
            qaPairs,
            crewaiSettings,
            expiresAt,
            image
        } = req.body

        const agent = await prisma.agent.create({
            data: {
                userId: (session.user as any).id,
                name,
                websiteUrl,
                useCase,
                responseMode,
                model,
                temperature,
                maxTokens,
                systemPrompt,
                lastTrained,
                status: status || 'active',
                conversations: conversations || 0,
                sources: sources || 0,
                qaPairs,
                crewaiSettings,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                image
            } as any
        })

        return res.status(201).json(agent)
    } catch (error: any) {
        console.error('Error creating agent:', error)
        return res.status(500).json({ error: 'Failed to create agent', details: error.message })
    }
}
