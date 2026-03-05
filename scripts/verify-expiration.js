const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('--- Verifying Time-Limited Usage & Admin Controls ---');

    try {
        // 1. Check for a user (or create one)
        let user = await prisma.user.findFirst({
            where: { email: 'admin@example.com' }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'admin@example.com',
                    name: 'Admin User',
                    role: 'ADMIN',
                    plan: 'PREMIUM'
                }
            });
            console.log('Created admin user');
        }

        // 2. Create an agent with expiration in the past
        const expiredAgent = await prisma.agent.create({
            data: {
                name: 'Expired Test Agent',
                userId: user.id,
                status: 'active',
                expiresAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            }
        });
        console.log(`Created expired agent: ${expiredAgent.id}`);

        // 3. Create a hidden agent
        const hiddenAgent = await prisma.agent.create({
            data: {
                name: 'Hidden Test Agent',
                userId: user.id,
                status: 'hidden',
            }
        });
        console.log(`Created hidden agent: ${hiddenAgent.id}`);

        console.log('\n--- Setup Complete ---');
        console.log('Now you can test the /api/agents/[id]/chat endpoint with these IDs:');
        console.log(`Expired Agent ID: ${expiredAgent.id}`);
        console.log(`Hidden Agent ID: ${hiddenAgent.id}`);

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
