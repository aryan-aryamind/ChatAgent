const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const targetId = 'cmmiqq2bd0003fd62ml3xu1t3'
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: targetId },
            select: { id: true, name: true }
        })

        if (agent) {
            console.log('✅ Agent FOUND:', agent)
        } else {
            console.log('❌ Agent NOT FOUND in database:', targetId)

            // Also list all IDs to see if there's a close match
            const allAgents = await prisma.agent.findMany({ select: { id: true } })
            console.log('All available IDs:', allAgents.map(a => a.id))
        }
    } catch (err) {
        console.error('Error:', err)
    } finally {
        await prisma.$disconnect()
    }
}

main()
