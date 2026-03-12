
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function listAgents() {
  try {
    const allAgents = await prisma.agent.findMany({
        select: { id: true, name: true, status: true }
    });
    let output = '--- ALL AGENTS ---\n';
    allAgents.forEach(a => {
        output += `ID: ${a.id} | Name: ${a.name} | Status: ${a.status}\n`;
    });
    output += '------------------\n';
    fs.writeFileSync('agents_list.txt', output);
    console.log('Wrote to agents_list.txt');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAgents();
