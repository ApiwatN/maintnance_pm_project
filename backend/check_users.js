const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.userMaster.findMany();
    console.log('Total users:', users.length);
    users.forEach(u => {
        console.log(`- ${u.username} (Role: ${u.systemRole})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
