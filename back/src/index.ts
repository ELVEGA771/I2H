import express from 'express';
import cors from 'cors';
import clientesRouter from './routes/clientes.js';
import negociosRouter from './routes/negocios.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/api/clientes', clientesRouter);
app.use('/api/negocios', negociosRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
