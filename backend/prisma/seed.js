const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const machines = [
    { code: '052453', name: 'GE2-001' },
    { code: '052639', name: 'GE2-002' },
    { code: '052638', name: 'GE2-003' },
    { code: '052640', name: 'GE2-004' },
    { code: '052641', name: 'GE2-005' },
    { code: '054656', name: 'GE2-006' },
    { code: '054668', name: 'GE2-007' },
    { code: '054669', name: 'GE2-008' },
    { code: '054657', name: 'GE2-009' },
    { code: '057902', name: 'GE2-010' },
    { code: '057918', name: 'GE2-011' },
    { code: '098490', name: 'GE2-012' },
    { code: '098491', name: 'GE2-013' },
    { code: '099717', name: 'GE2-014' },
    { code: '099718', name: 'GE2-015' },
    { code: '099719', name: 'GE2-016' },
    { code: '101375', name: 'GE2-017' },
    { code: '101360', name: 'GE2-018' },
    { code: '101760', name: 'GE2-019' },
    { code: '101761', name: 'GE2-020' },
    { code: '083878', name: 'GE2-021' },
    { code: '105062', name: 'GE2-022' },
    { code: '103001', name: 'GE2-033' },
    { code: '103002', name: 'GE2-034' },
    { code: '103003', name: 'GE2-035' },
    { code: '103004', name: 'GE2-036' },
    { code: '103005', name: 'GE2-037' },
    { code: '103006', name: 'GE2-038' },
    { code: '103007', name: 'GE2-039' },
    { code: '103008', name: 'GE2-040' },
    // { code: '105062', name: 'GE2-023' }, // DUPLICATE CODE with GE2-022. Skipping to avoid unique constraint error.
    { code: '106306', name: 'GE2-024' },
    { code: '20210702', name: 'GE2-025' },
    { code: '200803001', name: 'GE2-026' },
    { code: '200805003', name: 'GE2-028' },
    { code: '112311', name: 'GE3-001' },
    { code: '106307', name: 'GE3-002' },
    { code: 'GE3-003-NOCODE', name: 'GE3-003' }, // Code was "-" in image. Replaced with unique placeholder.
    { code: '200805004', name: 'GE3-004' },
    { code: '200805005', name: 'GE3-005' },
    { code: '200805006', name: 'GE3-006' },
    { code: '200805007', name: 'GE3-007' },
    { code: '130716', name: 'GE3-008' },
    { code: '130717', name: 'GE3-009' },
    { code: '131203', name: 'GE3-010' },
];

async function main() {
    console.log('Start seeding...');

    // 1. Create Area "CLASS 100"
    const area = await prisma.area.upsert({
        where: { name: 'CLASS 100' },
        update: {},
        create: {
            name: 'CLASS 100',
            description: 'Clean Room Class 100'
        }
    });
    console.log(`Upserted Area: ${area.name}`);

    // 2. Create Machine Type "Oil Fill Machine"
    const machineType = await prisma.machineType.upsert({
        where: { name: 'Oil Fill Machine' },
        update: { areaId: area.id },
        create: {
            name: 'Oil Fill Machine',
            description: 'Automatic Oil Filling Machines',
            areaId: area.id
        }
    });
    console.log(`Upserted Machine Type: ${machineType.name}`);

    // 3. Create Oil Fill Machine Masters
    let count = 0;
    for (const m of machines) {
        await prisma.machineMaster.upsert({
            where: { code: m.code },
            update: {
                name: m.name,
                machineTypeId: machineType.id
            },
            create: {
                code: m.code,
                name: m.name,
                machineTypeId: machineType.id
            }
        });
        count++;
    }
    console.log(`Seeded ${count} Oil Fill machine masters.`);

    // ==========================================
    // LASER WELDING MACHINES (CLASS 100)
    // ==========================================
    const laserMachines = [
        { code: '0354974', name: 'LSW-001' },
        { code: '0354975', name: 'LSW-002' },
        { code: '0354976', name: 'LSW-003' },
        { code: '0346913', name: 'LSW-004' },
        { code: '0346914', name: 'LSW-005' },
        { code: '0341430', name: 'LSW-006' },
        { code: '346915 WD-003', name: 'LSW-007' }, // Combined code from image
        { code: '347896 WD-004', name: 'LSW-008' }, // Combined code from image
        { code: '0341431', name: 'LSW-009' },
        { code: 'M190013', name: 'LSW-010' },
        { code: '280437', name: 'LSW-011' }, // Sanitized comma
        { code: '01100134', name: 'LSW-012' },
        { code: '5', name: 'LSW-013' }, // Keep short code
        { code: '01100066', name: 'LSW-014' },
        { code: 'M190018', name: 'LSW-015' },
        { code: 'LSW-016-NOCODE', name: 'LSW-016' }, // Placeholder for missing code
        { code: '06', name: 'LSW-017' },
        { code: '000600053', name: 'LSW-018' },
        { code: '0280428', name: 'LSW-019' },
        { code: 'LSW-020-NOCODE', name: 'LSW-020' }, // Placeholder for missing code
        { code: '04', name: 'LSW-021' },
        // LSW-022, 023 skipped in source image?
        { code: '01', name: 'LSW-024' },
        { code: '100401', name: 'LSW-025' },
        { code: '100402', name: 'LSW-026' },
        { code: '100403', name: 'LSW-027' },
        { code: '006', name: 'LSW-028' },
        { code: '008', name: 'LSW-029' },
        { code: '009', name: 'LSW-030' },
        { code: '0512689', name: 'LSW-031' },
        { code: '15', name: 'LSW-032' },
        { code: 'LSW-033-NOCODE', name: 'LSW-033' }, // Placeholder
        { code: 'LSW-034-NOCODE', name: 'LSW-034' }, // Placeholder
        { code: 'LSW-035-NOCODE', name: 'LSW-035' }, // Placeholder
    ];

    // 4. Create Machine Type "Laser Welding Machine"
    const laserType = await prisma.machineType.upsert({
        where: { name: 'Laser Welding Machine' },
        update: { areaId: area.id },
        create: {
            name: 'Laser Welding Machine',
            description: 'Laser Welding Machines',
            areaId: area.id
        }
    });
    console.log(`Upserted Machine Type: ${laserType.name}`);

    // 5. Create Laser Machine Masters
    let laserCount = 0;
    for (const m of laserMachines) {
        await prisma.machineMaster.upsert({
            where: { code: m.code },
            update: {
                name: m.name,
                machineTypeId: laserType.id
            },
            create: {
                code: m.code,
                name: m.name,
                machineTypeId: laserType.id
            }
        });
        laserCount++;
    }
    console.log(`Seeded ${laserCount} Laser Welding machine masters.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
