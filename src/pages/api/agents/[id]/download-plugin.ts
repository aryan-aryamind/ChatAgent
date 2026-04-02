import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  try {
    // 1. Fetch agent data to verify existence and get details
    const agent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // 2. Determine base URL (priority: ENV > Request Host)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    // 3. Read the PHP plugin template
    // Note: Moving template to an internal folder ensures it's bundled in production
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'ai-agent-wordpress-plugin.php.template');
    if (!fs.existsSync(templatePath)) {
      console.error(`Plugin template NOT found at: ${templatePath}`);
      return res.status(500).json({ error: 'Plugin template not found' });
    }

    let phpContent = fs.readFileSync(templatePath, 'utf8');

    // 4. Replace placeholders with dynamic values
    phpContent = phpContent
      .replace(/{{AGENT_ID}}/g, agent.id)
      .replace(/{{BASE_URL}}/g, baseUrl.replace(/\/$/, ''));

    // 5. Create a ZIP file on the fly
    const zip = new AdmZip();

    // Add the modified PHP file to the ZIP
    zip.addFile('ai-agent-wordpress-plugin/ai-agent-wordpress-plugin.php', Buffer.from(phpContent, 'utf8'));

    // Optionally add a readme if it exists
    const readmePath = path.join(process.cwd(), 'public', 'readme.txt');
    if (fs.existsSync(readmePath)) {
      zip.addLocalFile(readmePath, 'ai-agent-wordpress-plugin/');
    }

    const zipBuffer = zip.toBuffer();

    // 6. Set headers for file download
    const fileName = `ai-agent-${agent.name.toLowerCase().replace(/[^a-z0-p]/g, '-')}-wp-plugin.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    // 7. Send the ZIP content
    return res.send(zipBuffer);

  } catch (error) {
    console.error('Error generating plugin:', error);
    return res.status(500).json({ error: 'Internal server error while generating plugin' });
  }
}
