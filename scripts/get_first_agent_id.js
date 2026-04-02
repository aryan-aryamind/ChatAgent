const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.agent.findFirst();
  if (agent) {
    console.log(agent.id);
  } else {
    console.log('No agents found');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
