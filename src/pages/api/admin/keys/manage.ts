import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  // Strict Admin-only check
  if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' })
  }

  const { action, id, status } = req.body

  if (!id || !action) {
    return res.status(400).json({ error: 'ID and action are required' })
  }

  try {
    if (action === 'TOGGLE_STATUS') {
      const updatedKey = await prisma.apiKey.update({
        where: { id },
        data: { status: status === 'active' ? 'active' : 'disabled' }
      })
      return res.status(200).json({ message: `Key status updated to ${updatedKey.status}`, key: updatedKey })
    }

    if (action === 'DELETE') {
      await prisma.apiKey.delete({
        where: { id }
      })
      return res.status(200).json({ message: 'API key permanently deleted' })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (error) {
    console.error('[Admin API Keys] Management Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
