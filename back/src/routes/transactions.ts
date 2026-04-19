import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function parsePaymentQr(qrCode: unknown): { merchant_id: number; amount: number | null } | null {
	if (typeof qrCode !== 'string' || !qrCode.trim()) return null;
	const raw = qrCode.trim();

	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if (parsed.type === 'DEUNA_PAY') {
			const merchantId = Number(parsed.merchant_id);
			const amount = parsed.amount === null || parsed.amount === undefined ? null : Number(parsed.amount);
			const validAmount = amount !== null && Number.isFinite(amount) && amount > 0 ? amount : null;
			if (Number.isInteger(merchantId) && merchantId > 0) {
				return {
					merchant_id: merchantId,
					amount: validAmount
				};
			}
		}
	} catch {
		// Keep supporting a compact QR text for demos and manual tests.
	}

	const compact = raw.match(/^DEUNA_PAY:(\d+)(?::([0-9.]+))?$/);
	if (!compact) return null;
	const merchantId = Number(compact[1]);
	const amount = compact[2] ? Number(compact[2]) : null;
	const validAmount = amount !== null && Number.isFinite(amount) && amount > 0 ? amount : null;
	return {
		merchant_id: merchantId,
		amount: validAmount
	};
}

async function buildTransfer(client: any, userId: number, merchantId: number, amount: number, enrollRewards: boolean) {
	const { rows: merchantRows } = await client.query(
		`SELECT id, name, category, loyalty_enabled
		 FROM merchants
		 WHERE id = $1`,
		[merchantId]
	);
	if (!merchantRows.length) {
		return { status: 404, body: { error: 'Merchant not found' } };
	}

	const { rows: programs } = await client.query(
		`SELECT *
		 FROM loyalty_programs
		 WHERE merchant_id = $1 AND active = true
		 ORDER BY updated_at DESC, created_at DESC, id DESC
		 LIMIT 1`,
		[merchantId]
	);
	if (!programs.length) {
		return { status: 404, body: { error: 'No active loyalty program for this merchant' } };
	}
	const program = programs[0];

	const { rows: pendingRewards } = await client.query(
		`SELECT r.*, COALESCE(r.reward_title, lp.reward_value) AS reward_value, lp.reward_type
		 FROM rewards r
		 JOIN loyalty_programs lp ON lp.id = r.loyalty_program_id
		 WHERE r.user_id = $1 AND r.merchant_id = $2 AND r.status = 'unlocked'
		 ORDER BY r.unlocked_at DESC, r.id DESC
		 LIMIT 1`,
		[userId, merchantId]
	);

	const points_earned = enrollRewards ? Math.floor(amount) * Number(program.points_per_dollar ?? 100) : 0;

	await client.query(
		`INSERT INTO transactions (user_id, merchant_id, amount, points_earned) VALUES ($1, $2, $3, $4)`,
		[userId, merchantId, amount, points_earned]
	);

	if (enrollRewards) {
		await client.query(
			`INSERT INTO user_points (user_id, merchant_id, points_balance, total_points_earned)
			 VALUES ($1, $2, $3, $3)
			 ON CONFLICT (user_id, merchant_id) DO UPDATE
			 SET points_balance = user_points.points_balance + $3,
			     total_points_earned = user_points.total_points_earned + $3`,
			[userId, merchantId, points_earned]
		);
	}

	const { rows: pointsRows } = await client.query(
		`SELECT points_balance FROM user_points WHERE user_id = $1 AND merchant_id = $2`,
		[userId, merchantId]
	);
	const currentPoints = Number(pointsRows[0]?.points_balance ?? 0);

	return {
		status: 200,
		body: {
			merchant: merchantRows[0],
			merchant_name: merchantRows[0].name,
			points_earned,
			current_points: currentPoints,
			reward_threshold: program.reward_threshold,
			reward_unlocked: false,
			reward: null,
			applied_reward: null,
			pending_reward: pendingRewards[0] ?? null,
			enrolled: enrollRewards
		}
	};
}

router.post('/resolve-payment-qr', async (req, res) => {
	const parsed = parsePaymentQr(req.body.qr_code);
	if (!parsed) return res.status(400).json({ error: 'QR de pago no valido' });
	try {
		const { rows } = await pool.query(
			`SELECT m.*,
			        lp.id AS program_id,
			        lp.campaign_name,
			        lp.points_per_dollar,
			        lp.reward_threshold,
			        lp.reward_type,
			        lp.reward_value,
			        lp.terms,
			        lp.business_category,
			        lp.reward_tiers,
			        lp.active AS program_active
			 FROM merchants m
			 LEFT JOIN LATERAL (
			   SELECT *
			   FROM loyalty_programs
			   WHERE merchant_id = m.id AND active = true
			   ORDER BY updated_at DESC, created_at DESC, id DESC
			   LIMIT 1
			 ) lp ON true
			 WHERE m.id = $1`,
			[parsed.merchant_id]
		);
		if (!rows.length) return res.status(404).json({ error: 'Merchant not found' });
		res.json({ merchant: rows[0], amount: parsed.amount });
	} catch {
		res.status(500).json({ error: 'Database error' });
	}
});

router.post('/pay-qr', async (req, res) => {
	const parsed = parsePaymentQr(req.body.qr_code);
	if (!parsed) return res.status(400).json({ error: 'QR de pago no valido' });
	const userId = Number(req.body.user_id);
	const amount = Number(req.body.amount ?? parsed.amount);
	const enrollRewards = req.body.enroll_rewards !== false;
	if (!Number.isInteger(userId) || userId <= 0 || !amount || amount <= 0) {
		return res.status(400).json({ error: 'Missing or invalid required fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await buildTransfer(client, userId, parsed.merchant_id, amount, enrollRewards);
		if (result.status !== 200) {
			await client.query('ROLLBACK');
			return res.status(result.status).json(result.body);
		}
		await client.query('COMMIT');
		res.json({ ...result.body, paid_with_qr: true });
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('QR payment error:', err);
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

// POST /api/transactions/simulate
// body: { user_id, merchant_id, amount, enroll_rewards }
router.post('/simulate', async (req, res) => {
	const { user_id, merchant_id, amount } = req.body;
	const enrollRewards = req.body.enroll_rewards !== false;
	const numericAmount = Number(amount);
	if (!user_id || !merchant_id || !numericAmount || numericAmount <= 0) {
		return res.status(400).json({ error: 'Missing or invalid required fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const result = await buildTransfer(client, Number(user_id), Number(merchant_id), numericAmount, enrollRewards);
		if (result.status !== 200) {
			await client.query('ROLLBACK');
			return res.status(result.status).json(result.body);
		}

		await client.query('COMMIT');
		res.json(result.body);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Transaction simulate error:', err);
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

export default router;
