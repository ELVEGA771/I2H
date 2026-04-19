import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// POST /api/rewards/redeem-store
// body: { user_id, merchant_id, tier_id, points, title }
router.post('/redeem-store', async (req, res) => {
	const { user_id, merchant_id, tier_id, points, title } = req.body;
	const cost = Number(points);
	if (!user_id || !merchant_id || !tier_id || !title || !Number.isInteger(cost) || cost <= 0) {
		return res.status(400).json({ error: 'Missing or invalid reward fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const { rows: programRows } = await client.query(
			`SELECT *
			 FROM loyalty_programs
			 WHERE merchant_id = $1 AND active = true
			 ORDER BY updated_at DESC, created_at DESC, id DESC
			 LIMIT 1`,
			[merchant_id]
		);
		if (!programRows.length) {
			await client.query('ROLLBACK');
			return res.status(404).json({ error: 'No active loyalty program' });
		}

		const { rows: pointRows } = await client.query(
			`SELECT points_balance
			 FROM user_points
			 WHERE user_id = $1 AND merchant_id = $2
			 FOR UPDATE`,
			[user_id, merchant_id]
		);
		const balance = Number(pointRows[0]?.points_balance ?? 0);
		if (balance < cost) {
			await client.query('ROLLBACK');
			return res.status(400).json({ error: 'No tienes puntos suficientes' });
		}

		await client.query(
			`UPDATE user_points
			 SET points_balance = points_balance - $1
			 WHERE user_id = $2 AND merchant_id = $3`,
			[cost, user_id, merchant_id]
		);

		const qrCode = `DEUNA_REWARD:${user_id}:${merchant_id}:${tier_id}:${Date.now()}`;
		const { rows } = await client.query(
			`INSERT INTO rewards (user_id, merchant_id, loyalty_program_id, tier_id, reward_title, points_spent, status, qr_code)
			 VALUES ($1, $2, $3, $4, $5, $6, 'unlocked', $7)
			 RETURNING *`,
			[user_id, merchant_id, programRows[0].id, String(tier_id), String(title), cost, qrCode]
		);
		await client.query('COMMIT');
		res.json({
			...rows[0],
			reward_value: title,
			points_spent: cost,
			current_points: balance - cost,
			qr_code: qrCode
		});
	} catch {
		await client.query('ROLLBACK');
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

// POST /api/rewards/redeem-by-qr
// body: { qr_code }
router.post('/redeem-by-qr', async (req, res) => {
	const { qr_code } = req.body;
	if (!qr_code) return res.status(400).json({ error: 'Missing qr_code' });
	try {
		const { rows } = await pool.query(
			`WITH updated AS (
			   UPDATE rewards SET status = 'redeemed', redeemed_at = NOW()
			   WHERE qr_code = $1 AND status = 'unlocked'
			   RETURNING *
			 )
			 SELECT u.*,
			        m.name AS merchant_name,
			        usr.name AS user_name,
			        lp.campaign_name,
			        lp.reward_type,
			        COALESCE(u.reward_title, lp.reward_value) AS reward_value,
			        u.points_spent,
			        lp.terms
			 FROM updated u
			 JOIN users usr ON usr.id = u.user_id
			 JOIN merchants m ON m.id = u.merchant_id
			 JOIN loyalty_programs lp ON lp.id = u.loyalty_program_id`,
			[qr_code]
		);
		if (!rows.length) {
			return res.status(404).json({ error: 'QR no válido o ya fue canjeado' });
		}
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

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

// GET /api/rewards/:id - get reward details for QR display.
router.get('/:id', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT r.*,
			        m.name AS merchant_name,
			        u.name AS user_name,
			        lp.campaign_name,
			        lp.reward_type,
			        COALESCE(r.reward_title, lp.reward_value) AS reward_value,
			        lp.terms
			 FROM rewards r
			 JOIN users u ON u.id = r.user_id
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
