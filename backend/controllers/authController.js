const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../middleware/authMiddleware');

exports.login = async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Find user
        const user = await prisma.userMaster.findFirst({
            where: { username: username }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check password (Plain Text as requested)
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Token Expiration
        // Default: 24h
        // Remember Me: 30d (Wait, user requested 100 years for default/indefinite)
        // User Request: "ให้อยู่ได้ตลอดจนกว่าจะ logout" -> 100 years

        const expiresIn = '36500d'; // ~100 years

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                systemRole: user.systemRole,
                permissionType: user.permissionType,
                name: user.name
            },
            SECRET_KEY,
            { expiresIn: expiresIn }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                systemRole: user.systemRole,
                permissionType: user.permissionType,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        // req.user is set by middleware
        const user = await prisma.userMaster.findUnique({
            where: { id: req.user.id },
            include: {
                assignedMachines: {
                    select: { id: true, name: true, code: true }
                }
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            systemRole: user.systemRole,
            permissionType: user.permissionType,
            role: user.role,
            assignedMachines: user.assignedMachines
        });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
