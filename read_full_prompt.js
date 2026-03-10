const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function readPrompt() {
    const agent = await prisma.agent.findFirst({
        where: { name: { contains: 'Techify', mode: 'insensitive' } }
    });

    if (agent) {
        console.log('--- START PROMPT ---');
        console.log(agent.systemPrompt);
        console.log('--- END PROMPT ---');
    } else {
        console.log('Agent not found');
    }
}

readPrompt().finally(() => prisma.$disconnect());
