const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const agents = await prisma.agent.findMany({
            select: {
                id: true,
                name: true
            }
        })
        console.log('--- AGENT LIST ---')
        console.log(JSON.stringify(agents, null, 2))
        console.log('------------------')
    } catch (err) {
        console.error('Error fetching agents:', err)
    } finally {
        await prisma.$disconnect()
    }
}

main()
