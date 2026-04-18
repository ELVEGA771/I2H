import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/users/:id/points  — points per merchant for a user
router.get('/:id/points', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT up.merchant_id, up.points_balance, up.total_points_earned,
			        m.name AS merchant_name, m.category,
			        lp.reward_threshold, lp.reward_type, lp.reward_value,
			        lp.points_per_dollar,
			        r.id AS reward_id, r.status AS reward_status, r.qr_code
			 FROM user_points up
			 JOIN merchants m ON m.id = up.merchant_id
			 LEFT JOIN loyalty_programs lp ON lp.merchant_id = up.merchant_id AND lp.active = true
			 LEFT JOIN rewards r ON r.user_id = up.user_id AND r.merchant_id = up.merchant_id AND r.status = 'unlocked'
			 WHERE up.user_id = $1
			 ORDER BY up.points_balance DESC`,
			[req.params.id]
		);
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

export default router;
