const prisma = require('./prismaClient');

async function testSchedule() {
    try {
        const month = 12;
        const year = 2025;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        console.log(`Checking Schedule for ${month}/${year}`);

        // Get all machines with their PM plans
        const machines = await prisma.machine.findMany({
            where: {
                name: 'GE2-001'
            },
            include: {
                pmPlans: {
                    include: {
                        preventiveType: true
                    }
                },
                machineMaster: true
            }
        });

        const events = [];
        const today = new Date();

        machines.forEach(machine => {
            console.log(`Machine: ${machine.code} (${machine.id})`);
            if (machine.pmPlans) {
                machine.pmPlans.forEach(plan => {
                    console.log(`  Plan: ${plan.preventiveType.name} | NextPM: ${plan.nextPMDate}`);

                    if (plan.nextPMDate) {
                        const nextDate = new Date(plan.nextPMDate);
                        const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

                        let eventType = 'scheduled';
                        if (diffDays < 0) {
                            eventType = 'overdue';
                        } else if (diffDays <= plan.advanceNotifyDays) {
                            eventType = 'upcoming';
                        }

                        // Check if this scheduled event is in the requested month
                        const eventDate = new Date(plan.nextPMDate);
                        if (eventDate.getMonth() === parseInt(month) - 1 && eventDate.getFullYear() === parseInt(year)) {
                            console.log(`    -> MATCH! Type: ${eventType}`);
                            events.push({
                                id: `schedule-${machine.id}-${plan.preventiveTypeId}`,
                                type: eventType,
                                date: plan.nextPMDate,
                                machine: {
                                    id: machine.id,
                                    name: machine.name,
                                    code: machine.code
                                },
                                preventiveType: plan.preventiveType ? { name: plan.preventiveType.name } : null,
                                daysUntil: diffDays,
                                frequencyDays: plan.frequencyDays
                            });
                        } else {
                            console.log(`    -> No Match Month/Year`);
                        }
                    } else {
                        console.log(`    -> NextPM is null`);
                    }
                });
            }
        });

        console.log('Events:', JSON.stringify(events, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testSchedule();
