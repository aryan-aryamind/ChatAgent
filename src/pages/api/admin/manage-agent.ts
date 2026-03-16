import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getServerSession(req, res, authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin access required.' })
    }

    if (req.method === 'PATCH') {
        const { agentId, expiresAt, status } = req.body

        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' })
        }

        try {
            const updateData: any = {
                ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
                ...(status !== undefined && { status }),
            }

            const updatedAgent = await prisma.agent.update({
                where: { id: agentId },
                data: updateData,
            })

            return res.status(200).json(updatedAgent)
        } catch (error) {
            console.error('Error updating agent:', error)
            return res.status(500).json({ error: 'Failed to update agent' })
        }
    }

    if (req.method === 'DELETE') {
        const { agentId } = req.query

        if (!agentId || typeof agentId !== 'string') {
            return res.status(400).json({ error: 'Agent ID is required' })
        }

        try {
            await prisma.agent.delete({
                where: { id: agentId },
            })

            return res.status(200).json({ message: 'Agent deleted successfully' })
        } catch (error) {
            console.error('Error deleting agent:', error)
            return res.status(500).json({ error: 'Failed to delete agent' })
        }
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
