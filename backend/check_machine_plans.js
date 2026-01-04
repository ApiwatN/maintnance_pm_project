const prisma = require('./prismaClient');

async function checkMachinePlans() {
    // Find machine GE2-001
    const machine = await prisma.machine.findFirst({
        where: { code: '052453' },
        include: {
            pmPlans: {
                include: {
                    preventiveType: {
                        include: {
                            masterChecklists: true
                        }
                    }
                }
            }
        }
    });

    if (!machine) {
        console.log('Machine not found');
        return;
    }

    console.log('Machine:', machine.id, machine.name, machine.code);
    console.log('PM Plans count:', machine.pmPlans?.length || 0);

    if (machine.pmPlans) {
        machine.pmPlans.forEach((plan, idx) => {
            console.log(`\n[Plan ${idx}] preventiveTypeId: ${plan.preventiveTypeId}`);
            console.log(`         Name: ${plan.preventiveType?.name}`);
            console.log(`         Checklists: ${plan.preventiveType?.masterChecklists?.length || 0}`);
        });
    }

    await prisma.$disconnect();
}

checkMachinePlans().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
