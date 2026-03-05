const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Simple .env parser to avoid extra dependencies
function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length === 2) {
                process.env[parts[0].trim()] = parts[1].trim().replace(/^["']|["']$/g, '');
            }
        });
    }
}

async function seedAdmin() {
    loadEnv();

    const email = process.env.ADMIN_EMAIL || 'admin@chatagent.com';
    const password = process.env.ADMIN_PASSWORD || 'adminpassword123';

    console.log(`Checking for admin: ${email}`);

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('User exists. Updating role to ADMIN and plan to PREMIUM...');
            await prisma.user.update({
                where: { email },
                data: {
                    role: 'ADMIN',
                    plan: 'PREMIUM'
                },
            });
            console.log('User promoted successfully.');
        } else {
            console.log('Creating new admin user...');
            const hashedPassword = await bcrypt.hash(password, 12);
            await prisma.user.create({
                data: {
                    email,
                    name: 'Super Admin',
                    password: hashedPassword,
                    role: 'ADMIN',
                    plan: 'PREMIUM',
                },
            });
            console.log('Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
