import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'Key ID is required' })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Attempt to delete it directly (scoped to user)
    const result = await prisma.apiKey.deleteMany({
      where: {
        id,
        userId: user.id
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: 'Key not found or unauthorized' })
    }

    return res.status(200).json({ message: 'Key revoked successfully' })
  } catch (error) {
    console.error('[API Keys] Revoke Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
