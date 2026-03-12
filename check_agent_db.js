
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgent() {
  const agentId = 'cmmkm3tug00051mnflflcgt8e';
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
          id: true,
          name: true,
          status: true,
          systemPrompt: true
      }
    });

    if (agent) {
      console.log('Agent found:');
      console.log(JSON.stringify(agent, null, 2));
    } else {
      console.log('Agent not found with ID:', agentId);
    }

    const allAgents = await prisma.agent.findMany({
        take: 10,
        select: { id: true, name: true }
    });
    console.log('\nTop 10 Agents in DB:');
    console.log(JSON.stringify(allAgents, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgent();
