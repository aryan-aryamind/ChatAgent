import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  const form = formidable({})

  try {
    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const personaType = fields.persona_type?.[0] || 'general'
    const validId = typeof id === 'string' ? id : 'new'

    // Generate temporary agent ID if needed
    const tempAgentId = `temp-file-${Date.now()}`

    // Call Python processing service
    const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8016'

    // Read file from temporary path
    const fileBuffer = fs.readFileSync(file.filepath)
    const formData = new FormData()

    // Create a Blob from the buffer
    const blob = new Blob([fileBuffer], { type: file.mimetype || 'application/octet-stream' })
    formData.append('file', blob, file.originalFilename || 'document')
    formData.append('agent_id', tempAgentId)
    formData.append('persona_type', personaType)

    console.log(`📄 Forwarding file ${file.originalFilename} to Python service...`)

    const processResponse = await fetch(`${crewaiServiceUrl}/process-file`, {
      method: 'POST',
      body: formData,
    })

    if (!processResponse.ok) {
      const errorData = await processResponse.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Python service error: ${processResponse.statusText}`)
    }

    const resultData = await processResponse.json()

    // Include the tempAgentId in the response
    if (resultData.data) {
      resultData.data.tempAgentId = tempAgentId
    }

    return res.status(200).json(resultData)

  } catch (error: any) {
    console.error('File processing error:', error)
    return res.status(500).json({
      error: 'Failed to process file',
      message: error.message || 'Unknown error occurred'
    })
  }
}
