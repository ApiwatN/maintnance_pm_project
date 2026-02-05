const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const machineRoutes = require('./routes/machineRoutes');
const pmRoutes = require('./routes/pmRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const machineTypeRoutes = require('./routes/machineTypeRoutes');
const preventiveTypeRoutes = require('./routes/preventiveTypeRoutes');
const machineMasterRoutes = require('./routes/machineMasterRoutes');
const userMasterRoutes = require('./routes/userMasterRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportRoutes = require('./routes/reportRoutes');
const areaRoutes = require('./routes/areaRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const startScheduler = require('./scheduler');

const http = require('http'); // Import http
const { Server } = require('socket.io'); // Import Server from socket.io

const https = require('https');
const fs = require('fs');

const app = express();
let server;

// Check for SSL configuration
// Check for SSL configuration
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    try {
        const httpsOptions = {
            key: fs.readFileSync(process.env.SSL_KEY_PATH),
            cert: fs.readFileSync(process.env.SSL_CERT_PATH)
        };
        server = https.createServer(httpsOptions, app);
        console.log('Starting server in HTTPS mode...');
    } catch (error) {
        console.error('Failed to load SSL certificates, falling back to HTTP:', error.message);
        server = http.createServer(app);
    }
} else {
    // Fallback if env vars not set, but we want to try default paths for this fix
    try {
        const httpsOptions = {
            key: fs.readFileSync('./server.key'),
            cert: fs.readFileSync('./server.crt')
        };
        server = https.createServer(httpsOptions, app);
        console.log('Starting server in HTTPS mode (default paths)...');
    } catch (e) {
        console.log('No SSL certs found, using HTTP');
        server = http.createServer(app);
    }
}

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity (or configure specific frontend URL)
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io Middleware to expose io to controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.io Connection Handler (Optional logging)
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/machines', machineRoutes);
app.use('/api/pm', pmRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/machine-types', machineTypeRoutes);
app.use('/api/preventive-types', preventiveTypeRoutes);
app.use('/api/machine-master', machineMasterRoutes);
app.use('/api/user-master', userMasterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/auth', require('./routes/authRoutes'));

app.get('/', (req, res) => {
    res.send('Machine PM System API');
});

// Start Scheduler
startScheduler();

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
