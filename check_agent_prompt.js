const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgent() {
    const agents = await prisma.agent.findMany({
        where: { name: { contains: 'Techify', mode: 'insensitive' } }
    });

    for (const agent of agents) {
        console.log(`Agent: ${agent.name} (ID: ${agent.id})`);
        console.log('--- System Prompt ---');
        console.log(agent.systemPrompt);
        console.log('---------------------\n');
    }
}

checkAgent().finally(() => prisma.$disconnect());
