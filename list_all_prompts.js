const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAll() {
    const agents = await prisma.agent.findMany({
        select: { id: true, name: true, systemPrompt: true }
    });

    for (const a of agents) {
        console.log(`ID: ${a.id} | Name: ${a.name}`);
        console.log(`--- Prompt ---`);
        console.log(a.systemPrompt || '(empty)');
        console.log(`--------------\n`);
    }
}

listAll().finally(() => prisma.$disconnect());
