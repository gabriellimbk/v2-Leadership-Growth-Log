import { config as loadEnv } from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import notificationHandler from '../api/send-notification';

loadEnv({ path: '.env.local' });

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.post('/api/send-notification', (req, res) => notificationHandler(req as any, res as any));

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

app.listen(port, '0.0.0.0', () => {
  console.log(`Local app with API running at http://localhost:${port}/`);
});
