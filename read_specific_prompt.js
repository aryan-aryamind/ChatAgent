const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function readPrompt() {
    const id = 'cmmiqq2bd0003fd62ml3xu1t3';
    const agent = await prisma.agent.findUnique({
        where: { id }
    });

    if (agent) {
        console.log(`Agent: ${agent.name}`);
        console.log('--- START PROMPT ---');
        console.log(agent.systemPrompt);
        console.log('--- END PROMPT ---');
    } else {
        console.log('Agent not found');
    }
}

readPrompt().finally(() => prisma.$disconnect());
