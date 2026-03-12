const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Database Backup Script for PostgreSQL
 * This script parses the DATABASE_URL from .env and runs pg_dump.
 */

const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7;

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('Error: .env file not found');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

function getDbConfig(url) {
    // postgresql://username:password@host:port/database
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = url.match(regex);
    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        user: match[1],
        password: decodeURIComponent(match[2]),
        host: match[3],
        port: match[4],
        database: match[5]
    };
}

async function backup() {
    loadEnv();
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        console.error('Error: DATABASE_URL not found in .env');
        process.exit(1);
    }

    try {
        const config = getDbConfig(dbUrl);
        
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${config.database}-${timestamp}.sql`;
        const filePath = path.join(BACKUP_DIR, fileName);

        console.log(`--- Starting Backup: ${config.database} ---`);
        
        // Use PGPASSWORD to avoid interactive prompt
        process.env.PGPASSWORD = config.password;
        
        const command = `pg_dump -U ${config.user} -h ${config.host} -p ${config.port} -F p -f "${filePath}" ${config.database}`;
        
        console.log(`Executing: pg_dump (output to ${fileName})`);
        execSync(command);
        
        console.log('Backup successful!');

        // Cleanup old backups
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > MAX_BACKUPS) {
            console.log(`Cleaning up old backups (keeping latest ${MAX_BACKUPS})...`);
            files.slice(MAX_BACKUPS).forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file.name));
                console.log(`Deleted: ${file.name}`);
            });
        }

    } catch (error) {
        console.error('Backup failed:', error.message);
    } finally {
        delete process.env.PGPASSWORD;
    }
}

backup();
