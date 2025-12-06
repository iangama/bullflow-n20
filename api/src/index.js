import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Queue } from 'bullmq';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.API_PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const queue = new Queue('tasks', {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT || 6379)
  }
});

async function query(sql, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1', []);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { type, payload } = req.body || {};

    if (!type) {
      return res.status(400).json({ error: 'Campo "type" é obrigatório.' });
    }

    const finalPayload = payload || {};

    const insert = await query(
      `INSERT INTO tasks (type, payload, status, progress)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [type, finalPayload, 'queued', 0]
    );

    const taskId = insert.rows[0].id;

    await queue.add(
      'process-task',
      { taskId, payload: finalPayload },
      {
        jobId: taskId,
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    );

    res.status(201).json({ id: taskId, status: 'queued' });
  } catch (err) {
    console.error('Erro ao criar task:', err);
    res.status(500).json({ error: 'Erro interno ao criar task.' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, type, status, progress, created_at, updated_at
       FROM tasks
       ORDER BY created_at DESC
       LIMIT 50`,
      []
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar tasks:', err);
    res.status(500).json({ error: 'Erro interno ao listar tasks.' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, type, status, progress, payload, result, error,
              created_at, updated_at
       FROM tasks
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task não encontrada.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar task:', err);
    res.status(500).json({ error: 'Erro interno ao buscar task.' });
  }
});

app.listen(PORT, () => {
  console.log(`API ouvindo na porta ${PORT}`);
});
