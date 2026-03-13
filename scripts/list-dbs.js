const { Client } = require('pg');

async function listDatabases() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Aryan@123',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Databases:', res.rows.map(r => r.datname).join(', '));
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

listDatabases();
