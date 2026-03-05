import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' })
    }

    try {
        const agents = await prisma.agent.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return res.status(200).json(agents)
    } catch (error) {
        console.error('Error listing agents:', error)
        return res.status(500).json({ error: 'Failed to list agents' })
    }
}
