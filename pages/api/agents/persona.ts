import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { type, agent_id } = req.query

    try {
        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'

        let url = `${crewaiServiceUrl}/persona-templates`
        if (agent_id) {
            url = `${crewaiServiceUrl}/get-agent-settings/${agent_id}`
            if (type) {
                url += `?persona_type=${type}`
            }
        } else if (type) {
            url = `${crewaiServiceUrl}/persona-templates/${type}`
        }

        const response = await fetch(url)

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Backend error', details: await response.text() })
        }

        const data = await response.json()
        return res.status(200).json(data)

    } catch (error: any) {
        console.error('Error fetching persona:', error)
        return res.status(500).json({ error: 'Failed to connect to backend service' })
    }
}
