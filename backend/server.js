import express from 'express';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import https from 'https';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb, getDb, seedIfEmpty } from './services/db.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ensure local vendor copies of React UMD builds (CSP-safe)
async function ensureVendors(){
  const require = createRequire(import.meta.url);
  const vendorDir = path.join(__dirname, 'public', 'vendor');
  if (!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir, { recursive: true });

  const resolveCandidates = (cands) => {
    for (const c of cands) {
      try { if (c && fs.existsSync(c)) return c; } catch {}
    }
    return null;
  };

  const download = (url, dest, redirects = 3) => new Promise((resolve) => {
    https.get(url, (res) => {
      if ([301,302,307,308].includes(res.statusCode)) {
        const loc = res.headers.location;
        if (loc && redirects > 0) {
          const nextUrl = /^https?:\/\//i.test(loc) ? loc : new URL(loc, url).toString();
          return resolve(download(nextUrl, dest, redirects - 1));
        }
        console.warn('Vendor redirect without location for', url);
        return resolve();
      }
      if (res.statusCode !== 200) {
        console.warn('Vendor download HTTP', res.statusCode, url);
        return resolve();
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      console.warn('Vendor download failed', url, err.message);
      resolve();
    });
  });

  const ensureFile = async (cands, cdnUrl, destName) => {
    const dest = path.join(vendorDir, destName);
    const src = resolveCandidates(cands);
    if (src) {
      const srcStat = fs.statSync(src);
      const needsCopy = !fs.existsSync(dest) || fs.statSync(dest).mtimeMs < srcStat.mtimeMs;
      if (needsCopy) fs.copyFileSync(src, dest);
      return;
    }
    if (!fs.existsSync(dest)) {
      await download(cdnUrl, dest);
    }
  };

  const reactCand = [];
  try { reactCand.push(require.resolve('react/umd/react.production.min.js')); } catch {}
  reactCand.push(path.join(__dirname, '../../node_modules/react/umd/react.production.min.js'));

  const reactDomCand = [];
  try { reactDomCand.push(require.resolve('react-dom/umd/react-dom.production.min.js')); } catch {}
  reactDomCand.push(path.join(__dirname, '../../node_modules/react-dom/umd/react-dom.production.min.js'));

  await ensureFile(reactCand, 'https://unpkg.com/react@18/umd/react.production.min.js', 'react.production.min.js');
  await ensureFile(reactDomCand, 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', 'react-dom.production.min.js');
}

await ensureVendors();

// Security & parsing
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Logging
app.use(morgan('dev'));

// Rate limit
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Favicon (avoid 404 noise)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// DB init
await initDb();
await seedIfEmpty();

// Routes
import profileRouter from './routes/profile.js';
import queryRouter from './routes/queries.js';

app.use('/profile', profileRouter);
app.use('/', queryRouter);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Basic error logging already via morgan; include stack in dev only
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
});

const basePort = Number(process.env.PORT) || 3000;
function startWithFallback(p, attempts = 10) {
  const server = app.listen(p, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${p}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attempts > 0) {
      // eslint-disable-next-line no-console
      console.warn(`Port ${p} in use, trying ${p + 1}...`);
      startWithFallback(p + 1, attempts - 1);
    } else {
      throw err;
    }
  });
}
if (process.env.NODE_ENV !== 'test') {
  startWithFallback(basePort);
}

export default app;
