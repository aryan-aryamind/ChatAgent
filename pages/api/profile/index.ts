import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = (session.user as any).id

  if (!userId) {
    return res.status(401).json({ error: 'User ID not found' })
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          accounts: {
            select: {
              provider: true,
              type: true,
            },
          },
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(200).json({ user })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, image } = req.body

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(image !== undefined && { image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return res.status(200).json({ user: updatedUser })
    } catch (error) {
      console.error('Error updating user profile:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
