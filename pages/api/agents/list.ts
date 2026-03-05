import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const agents = await prisma.agent.findMany({
            where: {
                userId: (session.user as any).id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return res.status(200).json(agents)
    } catch (error) {
        console.error('Error fetching user agents:', error)
        return res.status(500).json({ error: 'Failed to fetch agents' })
    }
}
