const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearMachineData() {
    try {
        console.log('🗑️  Deleting all Machines...');
        const deletedMachines = await prisma.machine.deleteMany({});
        console.log(`   ✅ Deleted ${deletedMachines.count} machines`);

        console.log('🗑️  Deleting all MachineMasters...');
        const deletedMasters = await prisma.machineMaster.deleteMany({});
        console.log(`   ✅ Deleted ${deletedMasters.count} machine masters`);

        console.log('\n✨ Data cleared successfully!');
        console.log('👉 Now you can run: npx prisma migrate dev --name update_machine_master_code_model');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearMachineData();
