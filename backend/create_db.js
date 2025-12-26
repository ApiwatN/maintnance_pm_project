const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'sa@admin',
    server: 'localhost',
    database: 'master',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function createDatabase() {
    try {
        console.log('Connecting to SQL Server...');
        let pool = await sql.connect(config);
        console.log('Connected!');

        console.log('Creating database db_mm if not exists...');
        await pool.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'db_mm')
            BEGIN
                CREATE DATABASE db_mm
            END
        `);
        console.log('Database db_mm created or already exists.');

        await pool.close();
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
}

createDatabase();
