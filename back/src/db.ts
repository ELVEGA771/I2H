import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

export const pool = new Pool({
	host: process.env.DB_HOST ?? 'localhost',
	port: Number(process.env.DB_PORT ?? 5432),
	database: process.env.DB_NAME ?? 'i2h',
	user: process.env.DB_USER ?? 'postgres',
	password: process.env.DB_PASSWORD ?? 'postgres'
});

export async function initDb() {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const sql = readFileSync(join(__dirname, 'db/init.sql'), 'utf8');
	await pool.query(sql);
	console.log('DB schema initialized');
}
