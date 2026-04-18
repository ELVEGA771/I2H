import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import merchantsRouter from './routes/merchants.js';
import transactionsRouter from './routes/transactions.js';
import usersRouter from './routes/users.js';
import rewardsRouter from './routes/rewards.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/api/merchants', merchantsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/rewards', rewardsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

initDb()
	.then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
	.catch(err => { console.error('DB init failed', err); process.exit(1); });
