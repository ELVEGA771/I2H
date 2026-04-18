import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function applyDiscount(amount: number, rewardType: string, rewardValue: string): number {
	if (rewardType === 'discount') {
		const match = rewardValue.match(/\$?([\d.]+)/);
		if (match) return Math.max(0, amount - parseFloat(match[1]));
	}
	if (rewardType === 'percentage_off') {
		const match = rewardValue.match(/([\d.]+)%/);
		if (match) return amount * (1 - parseFloat(match[1]) / 100);
	}
	if (rewardType === 'free_product') {
		return 0;
	}
	return amount;
}

// POST /api/transactions/simulate
// body: { user_id, merchant_id, amount }
router.post('/simulate', async (req, res) => {
	const { user_id, merchant_id, amount } = req.body;
	if (!user_id || !merchant_id || !amount) {
		return res.status(400).json({ error: 'Missing required fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Get active loyalty program
		const { rows: programs } = await client.query(
			`SELECT * FROM loyalty_programs WHERE merchant_id = $1 AND active = true`,
			[merchant_id]
		);
		if (!programs.length) {
			await client.query('ROLLBACK');
			return res.status(404).json({ error: 'No active loyalty program for this merchant' });
		}
		const program = programs[0];

		// Check if user has an unlocked reward — apply it to this purchase
		const { rows: pendingRewards } = await client.query(
			`SELECT r.*, lp.reward_type, lp.reward_value
			 FROM rewards r
			 JOIN loyalty_programs lp ON lp.id = r.loyalty_program_id
			 WHERE r.user_id = $1 AND r.merchant_id = $2 AND r.status = 'unlocked'
			 LIMIT 1`,
			[user_id, merchant_id]
		);

		let applied_reward = null;
		let effective_amount = amount;

		if (pendingRewards.length) {
			const reward = pendingRewards[0];
			effective_amount = applyDiscount(amount, reward.reward_type, reward.reward_value);

			// Redeem the reward automatically
			await client.query(
				`UPDATE rewards SET status = 'redeemed', redeemed_at = NOW() WHERE id = $1`,
				[reward.id]
			);
			applied_reward = {
				id: reward.id,
				reward_type: reward.reward_type,
				reward_value: reward.reward_value,
				original_amount: amount,
				effective_amount: parseFloat(effective_amount.toFixed(2))
			};
		}

		const points_earned = Math.floor(effective_amount) * program.points_per_dollar;

		// Insert transaction with effective amount
		await client.query(
			`INSERT INTO transactions (user_id, merchant_id, amount, points_earned) VALUES ($1, $2, $3, $4)`,
			[user_id, merchant_id, effective_amount, points_earned]
		);

		// Upsert user_points
		await client.query(
			`INSERT INTO user_points (user_id, merchant_id, points_balance, total_points_earned)
			 VALUES ($1, $2, $3, $3)
			 ON CONFLICT (user_id, merchant_id) DO UPDATE
			 SET points_balance = user_points.points_balance + $3,
			     total_points_earned = user_points.total_points_earned + $3`,
			[user_id, merchant_id, points_earned]
		);

		// Check if a new reward should unlock
		const { rows: pointsRows } = await client.query(
			`SELECT points_balance FROM user_points WHERE user_id = $1 AND merchant_id = $2`,
			[user_id, merchant_id]
		);
		const currentPoints = pointsRows[0]?.points_balance ?? 0;

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
			applied_reward
		});
	} catch (err) {
		await client.query('ROLLBACK');
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

export default router;
