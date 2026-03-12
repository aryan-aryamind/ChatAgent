const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cleanup script to automatically delete agents that have been expired for more than 12 hours.
 * Based on the 'expiresAt' field in the Agent model.
 */
async function cleanup() {
    console.log('--- Starting Auto-Deletion Cleanup ---');
    
    // Calculate the threshold (7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`Searching for agents expired before: ${sevenDaysAgo.toISOString()}`);
    
    try {
        // Find agents that expired more than 12 hours ago
        const expiredAgents = await prisma.agent.findMany({
            where: {
                expiresAt: {
                    lt: sevenDaysAgo,
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                expiresAt: true
            }
        });

        if (expiredAgents.length === 0) {
            console.log('No agents found meeting the deletion criteria.');
            return;
        }

        console.log(`Found ${expiredAgents.length} agents to delete:`);
        expiredAgents.forEach(agent => {
            console.log(` - [${agent.id}] ${agent.name} (Expired at: ${agent.expiresAt.toISOString()})`);
        });

        // Perform the deletion
        const deleted = await prisma.agent.deleteMany({
            where: {
                expiresAt: {
                    lt: sevenDaysAgo,
                    not: null
                }
            }
        });

        console.log(`Successfully deleted ${deleted.count} agents.`);
        console.log('--- Cleanup Complete ---');
    } catch (error) {
        console.error('Error during auto-deletion process:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the cleanup
cleanup();
