import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// POST /api/rewards/:id/redeem
router.post('/:id/redeem', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`UPDATE rewards SET status = 'redeemed', redeemed_at = NOW()
			 WHERE id = $1 AND status = 'unlocked'
			 RETURNING *`,
			[req.params.id]
		);
		if (!rows.length) {
			return res.status(404).json({ error: 'Reward not found or already redeemed' });
		}
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/rewards/:id  — get reward details (for QR display)
router.get('/:id', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT r.*, m.name AS merchant_name, lp.reward_type, lp.reward_value
			 FROM rewards r
			 JOIN merchants m ON m.id = r.merchant_id
			 JOIN loyalty_programs lp ON lp.id = r.loyalty_program_id
			 WHERE r.id = $1`,
			[req.params.id]
		);
		if (!rows.length) return res.status(404).json({ error: 'Reward not found' });
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

export default router;
