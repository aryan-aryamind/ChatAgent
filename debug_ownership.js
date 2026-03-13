const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      status: true
    }
  });

  const targetEmail = 'aryanaryamind@gmail.com';
  const targetUser = users.find(u => u.email === targetEmail);
  const userAgents = targetUser ? agents.filter(a => a.userId === targetUser.id) : [];

  const data = {
    users,
    agents,
    targetUser,
    userAgents
  };

  fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
  console.log('Debug output written to debug_output.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
