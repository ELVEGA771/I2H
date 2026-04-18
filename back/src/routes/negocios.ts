import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
	try {
		const { rows } = await pool.query('SELECT * FROM negocios');
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

export default router;
