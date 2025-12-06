import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Worker } from 'bullmq';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379)
};

const concurrency = Number(process.env.WORKER_CONCURRENCY || 5);

async function updateTask(id, fields) {
  const keys = Object.keys(fields);
  const values = Object.values(fields);

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

  const sql = `
    UPDATE tasks
       SET ${setClauses},
           updated_at = NOW()
     WHERE id = $${keys.length + 1}
  `;

  const params = [...values, id];

  const client = await pool.connect();
  try {
    await client.query(sql, params);
  } finally {
    client.release();
  }
}

const worker = new Worker(
  'tasks',
  async job => {
    const { taskId, payload } = job.data;

    console.log(`[Worker] Iniciando task ${taskId}`);

    await updateTask(taskId, { status: 'processing', progress: 0 });

    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const progress = i * 20;
      await job.updateProgress(progress);
      await updateTask(taskId, { progress });
    }

    const result = {
      processedAt: new Date().toISOString(),
      payloadSize: JSON.stringify(payload || {}).length
    };

    await updateTask(taskId, {
      status: 'completed',
      progress: 100,
      result
    });

    console.log(`[Worker] Task ${taskId} concluída.`);

    return result;
  },
  {
    connection,
    concurrency
  }
);

worker.on('failed', async (job, err) => {
  if (!job) return;
  const taskId = job.data?.taskId;
  console.error(`[Worker] Task ${taskId} falhou:`, err.message);
  if (taskId) {
    await updateTask(taskId, {
      status: 'failed',
      error: err.message
    });
  }
});

process.on('SIGINT', async () => {
  console.log('Encerrando worker...');
  await worker.close();
  await pool.end();
  process.exit(0);
});
