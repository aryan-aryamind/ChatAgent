const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.session.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  const data = {
    sessions,
    count: sessions.length
  };

  fs.writeFileSync('session_debug.json', JSON.stringify(data, null, 2));
  console.log('Session debug output written to session_debug.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
