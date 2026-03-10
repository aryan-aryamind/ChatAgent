import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Agent ID is required' })
    }

    try {
        const agent = await prisma.agent.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' })
        }

        // Check if the agent belongs to the user or if the user is an admin
        if (agent.userId !== (session.user as any).id && (session.user as any).role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized to delete this agent' })
        }

        await prisma.agent.delete({
            where: { id }
        })

        return res.status(200).json({ message: 'Agent deleted successfully' })
    } catch (error) {
        console.error('Error deleting agent:', error)
        return res.status(500).json({ error: 'Failed to delete agent' })
    }
}
