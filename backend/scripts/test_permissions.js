const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Mock environment for local testing if needed, but we will use the running server or direct controller logic if possible.
// Actually, to test routes, we need to hit the API.
// Let's assume the server is running on localhost:5003 (from config).
const API_URL = 'http://localhost:5003/api';

async function runTest() {
    try {
        console.log("--- Starting Permission Verification Test ---");

        // 1. Setup Data
        console.log("1. Setting up test data...");

        // Create Areas
        const area1 = await prisma.area.upsert({
            where: { name: 'TestArea1' },
            update: {},
            create: { name: 'TestArea1', description: 'Test Area 1' }
        });
        const area2 = await prisma.area.upsert({
            where: { name: 'TestArea2' },
            update: {},
            create: { name: 'TestArea2', description: 'Test Area 2' }
        });

        // Create Machine Types
        const type1 = await prisma.machineType.upsert({
            where: { name: 'TestType1' },
            update: {},
            create: { name: 'TestType1', areaId: area1.id }
        });
        const type2 = await prisma.machineType.upsert({
            where: { name: 'TestType2' },
            update: {},
            create: { name: 'TestType2', areaId: area2.id }
        });

        // Create Preventive Types (for PM Plans)
        const pmType1 = await prisma.preventiveType.upsert({
            where: { name: 'TestPMType1' },
            update: {},
            create: { name: 'TestPMType1', description: 'Test PM Type 1' }
        });

        // Create Machine Masters
        const master1 = await prisma.machineMaster.upsert({
            where: { code: 'TestMaster1' },
            update: {},
            create: { code: 'TestMaster1', name: 'Test Master 1', machineTypeId: type1.id }
        });
        const master2 = await prisma.machineMaster.upsert({
            where: { code: 'TestMaster2' },
            update: {},
            create: { code: 'TestMaster2', name: 'Test Master 2', machineTypeId: type2.id }
        });

        // Create Machines
        const machine1 = await prisma.machine.upsert({
            where: { code: 'TestMachine1' },
            update: {},
            create: { code: 'TestMachine1', name: 'Test Machine 1', machineMasterId: master1.id }
        });

        // Create PM Plan for Machine 1 -> PM Type 1
        await prisma.machinePMPlan.upsert({
            where: {
                machineId_preventiveTypeId: {
                    machineId: machine1.id,
                    preventiveTypeId: pmType1.id
                }
            },
            create: {
                machineId: machine1.id,
                preventiveTypeId: pmType1.id,
                frequencyDays: 30,
                advanceNotifyDays: 7
            },
            update: {}
        });

        // Machine 2 is NOT assigned to user
        const machine2 = await prisma.machine.upsert({
            where: { code: 'TestMachine2' },
            update: {},
            create: { code: 'TestMachine2', name: 'Test Machine 2', machineMasterId: master2.id }
        });

        // Create Users
        // Admin
        let adminUser = await prisma.userMaster.findFirst({ where: { username: 'testadmin' } });
        if (adminUser) {
            adminUser = await prisma.userMaster.update({
                where: { id: adminUser.id },
                data: { systemRole: 'ADMIN', password: 'password123' }
            });
        } else {
            adminUser = await prisma.userMaster.create({
                data: { username: 'testadmin', name: 'Test Admin', role: 'BOTH', systemRole: 'ADMIN', password: 'password123' }
            });
        }

        // Normal User
        let normalUser = await prisma.userMaster.findFirst({ where: { username: 'testuser' } });
        if (normalUser) {
            normalUser = await prisma.userMaster.update({
                where: { id: normalUser.id },
                data: {
                    systemRole: 'USER',
                    password: 'password123',
                    assignedMachines: { set: [{ id: machine1.id }] }
                }
            });
        } else {
            normalUser = await prisma.userMaster.create({
                data: {
                    username: 'testuser',
                    name: 'Test User',
                    role: 'BOTH',
                    systemRole: 'USER',
                    password: 'password123',
                    assignedMachines: { connect: [{ id: machine1.id }] }
                }
            });
        }

        console.log("Data setup complete.");

        // Helper for fetch
        const post = async (url, body) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`POST ${url} failed: ${res.statusText}`);
            return res.json();
        };

        const get = async (url, token) => {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`GET ${url} failed: ${res.statusText}`);
            return res.json();
        };

        // 2. Test Admin Access
        console.log("\n2. Testing Admin Access...");
        const adminLogin = await post(`${API_URL}/auth/login`, { username: 'testadmin', password: 'password123' });
        const adminToken = adminLogin.token;

        const adminAreas = await get(`${API_URL}/areas`, adminToken);
        console.log(`Admin sees ${adminAreas.length} areas.`);

        const hasArea1 = adminAreas.find(a => a.id === area1.id);
        const hasArea2 = adminAreas.find(a => a.id === area2.id);

        if (hasArea1 && hasArea2) {
            console.log("PASS: Admin sees all areas.");
        } else {
            console.error("FAIL: Admin missing areas.");
        }

        // 3. Test User Access
        console.log("\n3. Testing User Access...");
        const userLogin = await post(`${API_URL}/auth/login`, { username: 'testuser', password: 'password123' });
        const userToken = userLogin.token;

        const userAreas = await get(`${API_URL}/areas`, userToken);
        console.log(`User sees ${userAreas.length} areas.`);

        const userHasArea1 = userAreas.find(a => a.id === area1.id);
        const userHasArea2 = userAreas.find(a => a.id === area2.id);

        if (userHasArea1 && !userHasArea2) {
            console.log("PASS: User sees ONLY assigned area.");
        } else {
            console.error("FAIL: User sees incorrect areas. (Expected Area 1, NOT Area 2)");
            console.log("Seen Areas:", userAreas.map(a => a.name));
        }

        // Test Machine Types for User
        const userTypes = await get(`${API_URL}/machine-types`, userToken);
        const userHasType1 = userTypes.find(t => t.id === type1.id);
        const userHasType2 = userTypes.find(t => t.id === type2.id);

        if (userHasType1 && !userHasType2) {
            console.log("PASS: User sees ONLY assigned machine types.");
        } else {
            console.error("FAIL: User sees incorrect machine types.");
            console.log("Seen Types:", userTypes.map(t => t.name));
        }

        // 4. Test Machine Access (Machine Name Filter)
        console.log("\n4. Testing Machine Access...");
        const userMachines = await get(`${API_URL}/machines`, userToken);
        console.log(`User sees ${userMachines.length} machines.`);

        const userHasMachine1 = userMachines.find(m => m.id === machine1.id);
        const userHasMachine2 = userMachines.find(m => m.id === machine2.id);

        if (userHasMachine1 && !userHasMachine2) {
            console.log("PASS: User sees ONLY assigned machines.");
        } else {
            console.error("FAIL: User sees incorrect machines.");
            console.log("Seen Machines:", userMachines.map(m => m.name));
        }

        // 5. Test Dashboard Stats
        console.log("\n5. Testing Dashboard Stats...");
        const dashboardStats = await get(`${API_URL}/pm/dashboard-stats`, userToken);
        const dashboardMachines = dashboardStats.totalMachines; // Dashboard stats returns counts, not list of machines directly in this endpoint? 
        // Wait, dashboard-stats returns { totalMachines, completed, upcoming, overdue }
        // The previous test assumed it returned a list of machines. Let's check dashboardController.getDashboardStats again.
        // It returns { totalMachines, completed, upcoming, overdue }.
        // BUT dashboardController.getDashboardStats (the one I modified) returns { summary: ..., machines: ... } ?
        // Let's check the code I wrote.
        // Ah, I modified `getDashboardStats` in `dashboardController.js` to return `machines` list.
        // BUT `pmController.js` ALSO has `getDashboardStats` which returns { totalMachines... }.
        // The route `/api/dashboard/stats` uses `dashboardController.getDashboardStats`.
        // The route `/api/pm/dashboard-stats` uses `pmController.getDashboardStats`.
        // I should test `/api/dashboard/stats` as that's the main one.

        const mainDashboard = await get(`${API_URL}/dashboard/stats`, userToken);
        const dashMachines = mainDashboard.machines;
        console.log(`User sees ${dashMachines.length} machines in Main Dashboard.`);

        const dashHasMachine1 = dashMachines.find(m => m.id === machine1.id);
        const dashHasMachine2 = dashMachines.find(m => m.id === machine2.id);

        if (dashHasMachine1 && !dashHasMachine2) {
            console.log("PASS: User sees ONLY assigned machines in Main Dashboard.");
        } else {
            console.error("FAIL: User sees incorrect machines in Main Dashboard.");
        }

        // 6. Test Machine Master Access
        console.log("\n6. Testing Machine Master Access...");
        const userMasters = await get(`${API_URL}/machine-master`, userToken);
        console.log(`User sees ${userMasters.length} machine masters.`);
        const hasMaster1 = userMasters.find(m => m.code === 'TestMaster1');
        const hasMaster2 = userMasters.find(m => m.code === 'TestMaster2');

        if (hasMaster1 && !hasMaster2) {
            console.log("PASS: User sees ONLY assigned machine masters.");
        } else {
            console.error("FAIL: User sees incorrect machine masters.");
        }

        // 7. Test Preventive Type Access
        console.log("\n7. Testing Preventive Type Access...");
        const userPmTypes = await get(`${API_URL}/preventive-types`, userToken);
        console.log(`User sees ${userPmTypes.length} preventive types.`);
        // Note: Types are linked via Machine -> MachineMaster -> MachineType -> Area
        // AND via Machine -> PMPlan -> PreventiveType
        // My filter logic for PreventiveType uses PMPlan.
        // In setup, I didn't create PM Plans. I should create them to test this properly.
        // Let's create a PM Plan for Machine 1.

        // 8. Test PM History Access
        console.log("\n8. Testing PM History Access...");
        // Try to access history for Machine 2 (Unassigned)
        try {
            await get(`${API_URL}/pm/machine/${machine2.id}/history`, userToken);
            console.error("FAIL: User accessed unassigned machine history.");
        } catch (e) {
            console.log("PASS: User denied access to unassigned machine history.");
        }

        // Try to access history for Machine 1 (Assigned)
        try {
            await get(`${API_URL}/pm/machine/${machine1.id}/history`, userToken);
            console.log("PASS: User accessed assigned machine history.");
        } catch (e) {
            console.error("FAIL: User denied access to assigned machine history.");
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
        // console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
