import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

const rewardTypes = new Set(['discount', 'free_product', 'percentage_off']);

type LoyaltyProgramFields = {
	campaign_name: string;
	points_per_dollar: number;
	reward_threshold: number;
	reward_type: string;
	reward_value: string;
	terms: string;
	active: boolean;
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
	if (value === undefined || value === null) return fallback;
	if (typeof value === 'boolean') return value;
	if (typeof value === 'string') return value.toLowerCase() !== 'false';
	return Boolean(value);
}

function parsePositiveInt(value: unknown, fallback: number): number {
	const parsed = Number(value ?? fallback);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : NaN;
}

function buildProgramFields(body: Record<string, unknown>, current: Partial<LoyaltyProgramFields> = {}): LoyaltyProgramFields {
	const campaign_name = String(body.campaign_name ?? current.campaign_name ?? 'Programa Rewards').trim();
	const points_per_dollar = parsePositiveInt(body.points_per_dollar, current.points_per_dollar ?? 1);
	const reward_threshold = parsePositiveInt(body.reward_threshold, current.reward_threshold ?? 10);
	const reward_type = String(body.reward_type ?? current.reward_type ?? 'discount').trim();
	const reward_value = String(body.reward_value ?? current.reward_value ?? '').trim();
	const terms = String(body.terms ?? current.terms ?? 'Válido para compras presenciales. Reward de un solo uso.').trim();
	const active = parseBoolean(body.active, current.active ?? true);

	if (!campaign_name || !reward_value || !terms || Number.isNaN(points_per_dollar) || Number.isNaN(reward_threshold) || !rewardTypes.has(reward_type)) {
		throw new Error('Invalid loyalty program fields');
	}

	return {
		campaign_name,
		points_per_dollar,
		reward_threshold,
		reward_type,
		reward_value,
		terms,
		active
	};
}

async function getLatestProgram(merchantId: string) {
	const { rows } = await pool.query(
		`SELECT *
		 FROM loyalty_programs
		 WHERE merchant_id = $1
		 ORDER BY active DESC, updated_at DESC, created_at DESC, id DESC
		 LIMIT 1`,
		[merchantId]
	);
	return rows[0] ?? null;
}

// GET /api/merchants
router.get('/', async (_req, res) => {
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
			        lp.active AS program_active
			 FROM merchants m
			 LEFT JOIN LATERAL (
			   SELECT *
			   FROM loyalty_programs
			   WHERE merchant_id = m.id AND active = true
			   ORDER BY updated_at DESC, created_at DESC, id DESC
			   LIMIT 1
			 ) lp ON true
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
			`SELECT m.*,
			        lp.id AS program_id,
			        lp.campaign_name,
			        lp.points_per_dollar,
			        lp.reward_threshold,
			        lp.reward_type,
			        lp.reward_value,
			        lp.terms,
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
			[req.params.id]
		);
		if (!rows.length) return res.status(404).json({ error: 'Merchant not found' });
		res.json(rows[0]);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/merchants/:id/loyalty-program
router.get('/:id/loyalty-program', async (req, res) => {
	try {
		const program = await getLatestProgram(req.params.id);
		if (!program) return res.status(404).json({ error: 'No loyalty program found' });
		res.json(program);
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

// GET /api/merchants/:id/rewards
router.get('/:id/rewards', async (req, res) => {
	try {
		const { rows } = await pool.query(
			`SELECT *
			 FROM loyalty_programs
			 WHERE merchant_id = $1 AND active = true
			 ORDER BY updated_at DESC, created_at DESC, id DESC
			 LIMIT 1`,
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
	let fields: LoyaltyProgramFields;
	try {
		fields = buildProgramFields(req.body);
	} catch {
		return res.status(400).json({ error: 'Missing or invalid loyalty program fields' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query(
			`UPDATE loyalty_programs SET active = false, updated_at = NOW() WHERE merchant_id = $1`,
			[req.params.id]
		);
		const { rows } = await client.query(
			`INSERT INTO loyalty_programs (
			   merchant_id, campaign_name, points_per_dollar, reward_threshold,
			   reward_type, reward_value, terms, active
			 )
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			 RETURNING *`,
			[
				req.params.id,
				fields.campaign_name,
				fields.points_per_dollar,
				fields.reward_threshold,
				fields.reward_type,
				fields.reward_value,
				fields.terms,
				fields.active
			]
		);
		await client.query(
			`UPDATE merchants SET loyalty_enabled = $1 WHERE id = $2`,
			[fields.active, req.params.id]
		);
		await client.query('COMMIT');
		res.status(201).json(rows[0]);
	} catch (err) {
		await client.query('ROLLBACK');
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
	}
});

// PUT /api/merchants/:id/loyalty-program
router.put('/:id/loyalty-program', async (req, res) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const { rows: existingRows } = await client.query(
			`SELECT *
			 FROM loyalty_programs
			 WHERE merchant_id = $1
			 ORDER BY active DESC, updated_at DESC, created_at DESC, id DESC
			 LIMIT 1`,
			[req.params.id]
		);
		const current = existingRows[0] ?? {};
		const fields = buildProgramFields(req.body, current);

		await client.query(
			`UPDATE loyalty_programs SET active = false, updated_at = NOW() WHERE merchant_id = $1`,
			[req.params.id]
		);

		const { rows } = existingRows.length
			? await client.query(
				`UPDATE loyalty_programs
				 SET campaign_name = $1,
				     points_per_dollar = $2,
				     reward_threshold = $3,
				     reward_type = $4,
				     reward_value = $5,
				     terms = $6,
				     active = $7,
				     updated_at = NOW()
				 WHERE id = $8
				 RETURNING *`,
				[
					fields.campaign_name,
					fields.points_per_dollar,
					fields.reward_threshold,
					fields.reward_type,
					fields.reward_value,
					fields.terms,
					fields.active,
					current.id
				]
			)
			: await client.query(
				`INSERT INTO loyalty_programs (
				   merchant_id, campaign_name, points_per_dollar, reward_threshold,
				   reward_type, reward_value, terms, active
				 )
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				 RETURNING *`,
				[
					req.params.id,
					fields.campaign_name,
					fields.points_per_dollar,
					fields.reward_threshold,
					fields.reward_type,
					fields.reward_value,
					fields.terms,
					fields.active
				]
			);

		await client.query(
			`UPDATE merchants SET loyalty_enabled = $1 WHERE id = $2`,
			[fields.active, req.params.id]
		);
		await client.query('COMMIT');
		res.json(rows[0]);
	} catch (err) {
		await client.query('ROLLBACK');
		if (err instanceof Error && err.message === 'Invalid loyalty program fields') {
			return res.status(400).json({ error: 'Missing or invalid loyalty program fields' });
		}
		res.status(500).json({ error: 'Database error' });
	} finally {
		client.release();
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
				`SELECT user_id FROM transactions
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
			estimated_return: `+${Math.round((recurringCount / Math.max(enrolledCount, 1)) * 100)}% recurrencia`,
			top_clients: topClients.rows
		});
	} catch (err) {
		res.status(500).json({ error: 'Database error' });
	}
});

export default router;
