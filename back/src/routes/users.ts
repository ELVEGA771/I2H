import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/users/:id/points - points per merchant for a user.
router.get('/:id/points', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT up.merchant_id,
			        up.points_balance,
			        up.total_points_earned,
			        m.name AS merchant_name,
			        m.category,
			        lp.id AS program_id,
			        lp.campaign_name,
			        lp.reward_threshold,
			        lp.reward_type,
			        lp.reward_value,
			        lp.terms,
			        lp.points_per_dollar,
			        lp.business_category,
			        lp.reward_tiers,
			        r.id AS reward_id,
			        r.status AS reward_status,
			        r.qr_code
			 FROM user_points up
			 JOIN merchants m ON m.id = up.merchant_id
			 LEFT JOIN LATERAL (
			   SELECT *
			   FROM loyalty_programs
			   WHERE merchant_id = up.merchant_id AND active = true
			   ORDER BY updated_at DESC, created_at DESC, id DESC
			   LIMIT 1
			 ) lp ON true
			 LEFT JOIN LATERAL (
			   SELECT *
			   FROM rewards
			   WHERE user_id = up.user_id
			     AND merchant_id = up.merchant_id
			     AND status = 'unlocked'
			   ORDER BY unlocked_at DESC, id DESC
			   LIMIT 1
			 ) r ON true
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
