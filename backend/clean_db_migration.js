const prisma = require('./prismaClient');

async function clean() {
    try {
        console.log('Deleting Machines...');
        await prisma.machine.deleteMany({});
        console.log('Deleting MachineMasters...');
        await prisma.machineMaster.deleteMany({});
        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
