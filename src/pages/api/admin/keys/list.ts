import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type ApiKeyWithUserAndAgent = Prisma.ApiKeyGetPayload<{
  include: { 
    user: { select: { email: true, name: true } },
    agent: { select: { name: true, id: true } } 
  }
}>

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  // Strict Admin-only check
  if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            plan: true
          }
        },
        agent: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json(apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      userEmail: key.user?.email,
      userName: key.user?.name,
      userPlan: key.user?.plan,
      agentName: key.agent?.name,
      agentId: key.agentId,
      usageCount: key.usageCount,
      status: key.status,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt
    })))
  } catch (error) {
    console.error('[Admin API Keys] List Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
