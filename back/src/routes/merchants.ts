import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/merchants
router.get('/', async (_req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT m.*, lp.reward_threshold, lp.reward_type, lp.reward_value
			 FROM merchants m
			 LEFT JOIN loyalty_programs lp ON lp.merchant_id = m.id AND lp.active = true
			 ORDER BY m.sponsor_level DESC, m.is_featured DESC, m.name`
		);
		res.json(rows);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/merchants/:id
router.get('/:id', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT m.*, lp.id as program_id, lp.points_per_dollar, lp.reward_threshold,
			        lp.reward_type, lp.reward_value
			 FROM merchants m
			 LEFT JOIN loyalty_programs lp ON lp.merchant_id = m.id AND lp.active = true
			 WHERE m.id = $1`,
			[req.params.id]
		);
		if (!rows.length) return res.status(404).json({ error: 'Merchant not found' });
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/merchants/:id/rewards
router.get('/:id/rewards', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT * FROM loyalty_programs WHERE merchant_id = $1 AND active = true`,
			[req.params.id]
		);
		if (!rows.length) return res.status(404).json({ error: 'No active program' });
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// POST /api/merchants/:id/loyalty-program
router.post('/:id/loyalty-program', async (req, res) => {
	const { points_per_dollar = 1, reward_threshold, reward_type, reward_value } = req.body;
	if (!reward_threshold || !reward_type || !reward_value) {
		return res.status(400).json({ error: 'Missing required fields' });
	}
	try {
		await pool.query(
			`UPDATE loyalty_programs SET active = false WHERE merchant_id = $1`,
			[req.params.id]
		);
		const { rows } = await pool.query(
			`INSERT INTO loyalty_programs (merchant_id, points_per_dollar, reward_threshold, reward_type, reward_value)
			 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
			[req.params.id, points_per_dollar, reward_threshold, reward_type, reward_value]
		);
		await pool.query(
			`UPDATE merchants SET loyalty_enabled = true WHERE id = $1`,
			[req.params.id]
		);
		res.status(201).json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/merchants/:id/insights
router.get('/:id/insights', async (req, res) => {
	const merchantId = req.params.id;
	try {
		const [enrolled, recurring, unlocked, redeemed, topClients] = await Promise.all([
			pool.query(
				`SELECT COUNT(DISTINCT user_id) AS count FROM user_points WHERE merchant_id = $1`,
				[merchantId]
			),
			pool.query(
				`SELECT COUNT(DISTINCT user_id) AS count FROM transactions
				 WHERE merchant_id = $1
				 GROUP BY user_id HAVING COUNT(*) >= 2`,
				[merchantId]
			),
			pool.query(
				`SELECT COUNT(*) AS count FROM rewards WHERE merchant_id = $1 AND status = 'unlocked'`,
				[merchantId]
			),
			pool.query(
				`SELECT COUNT(*) AS count FROM rewards WHERE merchant_id = $1 AND status = 'redeemed'`,
				[merchantId]
			),
			pool.query(
				`SELECT u.name, up.points_balance, up.total_points_earned
				 FROM user_points up
				 JOIN users u ON u.id = up.user_id
				 WHERE up.merchant_id = $1
				 ORDER BY up.total_points_earned DESC
				 LIMIT 5`,
				[merchantId]
			)
		]);

		const enrolledCount = parseInt(enrolled.rows[0]?.count ?? '0');
		const recurringCount = recurring.rows.length;

		res.json({
			clients_enrolled: enrolledCount,
			clients_recurring: recurringCount,
			rewards_unlocked: parseInt(unlocked.rows[0]?.count ?? '0'),
			rewards_redeemed: parseInt(redeemed.rows[0]?.count ?? '0'),
			estimated_return: `+${Math.round(recurringCount / Math.max(enrolledCount, 1) * 100)}% recurrencia`,
			top_clients: topClients.rows
		});
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

export default router;
