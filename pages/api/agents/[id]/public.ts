import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Agent ID is required' })
    }

    try {
        const agent = await prisma.agent.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                status: true,
                expiresAt: true,
            },
        })

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' })
        }

        return res.status(200).json(agent)
    } catch (error) {
        console.error('Error fetching public agent info:', error)
        return res.status(500).json({ error: 'Failed to fetch agent info' })
    }
}
