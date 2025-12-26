const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'admin';
    const adminPassword = 'password123'; // Change this!

    // Check if admin exists
    const existingAdmin = await prisma.userMaster.findUnique({
        where: { username: adminUsername },
    });

    if (!existingAdmin) {
        console.log('Creating default admin user...');
        await prisma.userMaster.create({
            data: {
                username: adminUsername,
                password: adminPassword,
                name: 'System Admin',
                role: 'BOTH', // Can inspect and check
                systemRole: 'ADMIN',
                employeeId: 'ADMIN001'
            },
        });
        console.log(`Admin user created. Username: ${adminUsername}, Password: ${adminPassword}`);
    } else {
        console.log('Admin user already exists.');
        // Optional: Update existing admin to ensure systemRole is ADMIN
        if (existingAdmin.systemRole !== 'ADMIN') {
            await prisma.userMaster.update({
                where: { id: existingAdmin.id },
                data: { systemRole: 'ADMIN' }
            });
            console.log('Updated existing admin systemRole to ADMIN');
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
