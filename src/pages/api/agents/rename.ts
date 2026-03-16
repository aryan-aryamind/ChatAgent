import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { oldAgentId, newAgentId } = req.body

  if (!oldAgentId || !newAgentId) {
    return res.status(400).json({ error: 'Old and new agent IDs are required' })
  }

  try {
    const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'
    
    console.log(`🔄 Renaming agent content from ${oldAgentId} to ${newAgentId}`)
    
    // Call Python service to rename
    const response = await fetch(`${crewaiServiceUrl}/rename-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_agent_id: oldAgentId,
        new_agent_id: newAgentId,
      }),
    })

    if (!response.ok) {
        // If 404/500, we might still want to proceed if it's just missing content
        // But let's report the error
        console.warn(`Rename failed with status ${response.status}`)
        // We don't fail the request because the agent is already created
        // and we don't want to break the flow if scraping failed previously
        return res.status(200).json({ 
            warning: 'Failed to rename content on backend',
            details: await response.text() 
        })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error: any) {
    console.error('Error renaming agent:', error)
    // Non-blocking error
    return res.status(200).json({ warning: 'Failed to connect to backend service' })
  }
}
