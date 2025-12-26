const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.userMaster.findFirst({
        where: { username: 'admin' }
    });

    if (user) {
        await prisma.userMaster.update({
            where: { id: user.id },
            data: { password: '1234' }
        });
        console.log('Password for admin reset to 1234');
    } else {
        console.log('User admin not found');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
