const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const agentId = 'cmmj1rvq300017pugtusginks'
    const agent = await prisma.agent.findUnique({
        where: { id: agentId }
    })

    if (agent) {
        console.log('✅ Agent found:', JSON.stringify(agent, null, 2))
    } else {
        console.log('❌ Agent not found in database.')

        // List all agents to see what's available
        const allAgents = await prisma.agent.findMany({
            select: { id: true, name: true }
        })
        console.log('All agents in DB:', JSON.stringify(allAgents, null, 2))
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
