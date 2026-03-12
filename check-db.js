const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const agents = await prisma.agent.count();
    const users = await prisma.user.count();
    const accounts = await prisma.account.count();
    const sessions = await prisma.session.count();
    
    console.log('--- Database Record Counts ---');
    console.log(JSON.stringify({
      agents,
      users,
      accounts,
      sessions
    }, null, 2));
    
    if (agents === 0 && users === 0) {
        console.log('\nWARNING: Database appears to be completely empty of users and agents.');
    }
  } catch (error) {
    console.error('Error connecting to DB:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
