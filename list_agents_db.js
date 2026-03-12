
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAgents() {
  try {
    const allAgents = await prisma.agent.findMany({
        select: { id: true, name: true, status: true }
    });
    console.log('--- ALL AGENTS ---');
    allAgents.forEach(a => {
        console.log(`ID: ${a.id} | Name: ${a.name} | Status: ${a.status}`);
    });
    console.log('------------------');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAgents();
