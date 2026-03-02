import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000'

        const response = await fetch(`${crewaiServiceUrl}/update-agent-settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return res.status(response.status).json({ error: 'Backend error', details: errorText })
        }

        const data = await response.json()
        return res.status(200).json(data)

    } catch (error: any) {
        console.error('Error updating agent settings:', error)
        return res.status(500).json({ error: 'Failed to connect to backend service' })
    }
}
