import 'dotenv/config';
import express    from 'express';
import helmet     from 'helmet';
import cors       from 'cors';
import morgan     from 'morgan';

import { connectDB }     from '../config/db.js';
import { authRouter }    from './routes/auth.routes.js';
import { userRouter }    from './routes/user.routes.js';
import { vaultRouter }   from './routes/vault.routes.js';
import { errorHandler }  from './middleware/error.middleware.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security & parsing middleware ──────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: false, // disable for simpler deployment if needed, or configure fully
}));
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || true, // Allow all in production or specific origin
  credentials: true,
}));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Static files for React buildup
const frontendPath = path.join(__dirname, '../../password-checker-frontend/dist');
app.use(express.static(frontendPath));

/* ── Routes ─────────────────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));
app.use('/api/auth',  authRouter);
app.use('/api/users', userRouter);
app.use('/api/vault', vaultRouter);

/* ── SPA Fallback (Must be after API routes) ────────────────────────────── */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/* ── Error handler (must be last) ───────────────────────────────────────── */
app.use(errorHandler);

/* ── Start ──────────────────────────────────────────────────────────────── */
(async () => {
  await connectDB();
  app.listen(PORT, () =>
    console.log(`SecureVault API listening on http://localhost:${PORT}`)
  );
})();
