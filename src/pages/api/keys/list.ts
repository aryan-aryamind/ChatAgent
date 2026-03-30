import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type ApiKeyWithAgent = Prisma.ApiKeyGetPayload<{
  include: { agent: { select: { name: true, id: true } } }
}>

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      include: {
        agent: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json(apiKeys.map((key: ApiKeyWithAgent) => ({
      id: key.id,
      name: key.name,
      agentName: key.agent.name,
      agentId: key.agentId,
      usageCount: key.usageCount,
      status: key.status,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt
    })))
  } catch (error) {
    console.error('[API Keys] List Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
