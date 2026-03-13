const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const email = 'aryanaryamind@gmail.com';
  
  const users = await prisma.user.findMany({
    where: { email },
    include: {
      accounts: true,
      agents: true
    }
  });

  const allAgents = await prisma.agent.findMany();

  const data = {
    targetUser: users,
    allAgentsCount: allAgents.length,
    allAgents: allAgents.map(a => ({ id: a.id, name: a.name, userId: a.userId }))
  };

  fs.writeFileSync('comprehensive_debug.json', JSON.stringify(data, null, 2));
  console.log('Comprehensive debug output written to comprehensive_debug.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
