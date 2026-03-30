import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, agentId } = req.body

  if (!name || !agentId) {
    return res.status(400).json({ error: 'Name and Agent ID are required' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
        userId: user.id
      }
    })

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found or unauthorized' })
    }

    // Generate a secure random key
    const rawKey = `sk_${crypto.randomBytes(24).toString('hex')}`
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        userId: user.id,
        agentId: agentId,
      },
    })

    // Return the raw key ONLY once
    return res.status(200).json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // This is the only time the user will see the raw key
      createdAt: apiKey.createdAt
    })
  } catch (error) {
    console.error('[API Keys] Create Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
