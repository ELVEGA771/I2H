import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// POST /api/transactions/simulate
// body: { user_id, merchant_id, amount }
router.post('/simulate', async (req, res) => {
	const { user_id, merchant_id, amount } = req.body;
	const numericAmount = Number(amount);
	if (!user_id || !merchant_id || !numericAmount || numericAmount <= 0) {
		return res.status(400).json({ error: 'Missing or invalid required fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		const { rows: programs } = await client.query(
			`SELECT *
			 FROM loyalty_programs
			 WHERE merchant_id = $1 AND active = true
			 ORDER BY updated_at DESC, created_at DESC, id DESC
			 LIMIT 1`,
			[merchant_id]
		);
		if (!programs.length) {
			await client.query('ROLLBACK');
			return res.status(404).json({ error: 'No active loyalty program for this merchant' });
		}
		const program = programs[0];

		const { rows: pendingRewards } = await client.query(
			`SELECT r.*, lp.reward_type, lp.reward_value
			 FROM rewards r
			 JOIN loyalty_programs lp ON lp.id = r.loyalty_program_id
			 WHERE r.user_id = $1 AND r.merchant_id = $2 AND r.status = 'unlocked'
			 ORDER BY r.unlocked_at DESC, r.id DESC
			 LIMIT 1`,
			[user_id, merchant_id]
		);

		const points_earned = Math.floor(numericAmount) * program.points_per_dollar;

		await client.query(
			`INSERT INTO transactions (user_id, merchant_id, amount, points_earned) VALUES ($1, $2, $3, $4)`,
			[user_id, merchant_id, numericAmount, points_earned]
		);

		await client.query(
			`INSERT INTO user_points (user_id, merchant_id, points_balance, total_points_earned)
			 VALUES ($1, $2, $3, $3)
			 ON CONFLICT (user_id, merchant_id) DO UPDATE
			 SET points_balance = user_points.points_balance + $3,
			     total_points_earned = user_points.total_points_earned + $3`,
			[user_id, merchant_id, points_earned]
		);

		const { rows: pointsRows } = await client.query(
			`SELECT points_balance FROM user_points WHERE user_id = $1 AND merchant_id = $2`,
			[user_id, merchant_id]
		);
		const currentPoints = Number(pointsRows[0]?.points_balance ?? 0);

		let new_reward = null;
		if (currentPoints >= program.reward_threshold) {
			const { rows: existing } = await client.query(
				`SELECT id FROM rewards WHERE user_id = $1 AND merchant_id = $2 AND status = 'unlocked'`,
				[user_id, merchant_id]
			);
			if (!existing.length) {
				const qrCode = `QR-${user_id}-${merchant_id}-${Date.now()}`;
				const { rows: rewardRows } = await client.query(
					`INSERT INTO rewards (user_id, merchant_id, loyalty_program_id, status, qr_code)
					 VALUES ($1, $2, $3, 'unlocked', $4) RETURNING *`,
					[user_id, merchant_id, program.id, qrCode]
				);
				new_reward = rewardRows[0];
				await client.query(
					`UPDATE user_points SET points_balance = points_balance - $1 WHERE user_id = $2 AND merchant_id = $3`,
					[program.reward_threshold, user_id, merchant_id]
				);
			}
		}

		await client.query('COMMIT');

		res.json({
			points_earned,
			current_points: currentPoints >= program.reward_threshold
				? currentPoints - program.reward_threshold
				: currentPoints,
			reward_threshold: program.reward_threshold,
			reward_unlocked: !!new_reward,
			reward: new_reward,
			applied_reward: null,
			pending_reward: pendingRewards[0] ?? null
		});
	} catch (err) {
		await client.query('ROLLBACK');
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

export default router;
