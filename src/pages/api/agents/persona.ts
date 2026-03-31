import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { type, agent_id } = req.query

    try {
        const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

        let url = `${crewaiServiceUrl}/persona-templates`
        if (agent_id) {
            url = `${crewaiServiceUrl}/get-agent-settings/${agent_id}`
            if (type) {
                url += `?persona_type=${type}`
            }
        } else if (type) {
            url = `${crewaiServiceUrl}/persona-templates/${type}`
        }

        const response = await fetch(url, {
            signal: AbortSignal.timeout(600000)
        })

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Backend error', details: await response.text() })
        }

        const data = await response.json()
        return res.status(200).json(data)

    } catch (error: any) {
        // Detailed logging for debugging, but clean response for frontend
        const errorMessage = error.cause?.code === 'ECONNREFUSED' 
            ? 'Backend service is not running' 
            : error.message;
            
        console.error(`[Persona API Error]: ${errorMessage}`, { agent_id, type });
        
        return res.status(500).json({ 
            error: 'Backend service unreachable',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        })
    }
}
