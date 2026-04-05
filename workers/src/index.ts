import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { casesRoutes } from './routes/cases';
import { uploadRoutes } from './routes/upload';
import { analyseRoutes } from './routes/analyse';
import { voiceRoutes } from './routes/voice';
import { letterRoutes } from './routes/letter';
import { stripeRoutes } from './routes/stripe';
import { usersRoutes } from './routes/users';
import { translateRoutes } from './routes/translate';
import { evidencePackRoutes } from './routes/evidence-pack';
import { authMiddleware } from './middleware/auth';
import { handleScheduled } from './cron/escalation';

export interface Env {
  // Secrets — via CF dashboard, never in code
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_JWKS_URL: string;
  DATABASE_URL: string;
  DB_ENCRYPTION_KEY: string;
  ANTHROPIC_API_KEY: string;
  SPEECHMATICS_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  UPSTASH_REDIS_URL: string;
  UPSTASH_REDIS_TOKEN: string;
  CF_AI_TOKEN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;

  // Non-secret vars
  ENVIRONMENT: string;

  // Bindings
  EVIDENCE_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// ── Global middleware ───────────────────────────────────────

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      const allowed = [
        'https://rentshield.co.uk',
        'https://www.rentshield.co.uk',
      ];
      if (origin?.startsWith('http://localhost:')) {
        return origin;
      }
      return allowed.includes(origin ?? '') ? origin! : '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// Body size limits
app.use('/api/*', bodyLimit({ maxSize: 15 * 1024 * 1024 }));

// Auth — exempt webhook endpoints (they use their own signature verification)
app.use('/api/*', async (c, next) => {
  const exemptPaths = [
    '/api/stripe/webhook',
    '/api/users/webhook',
  ];
  if (exemptPaths.includes(c.req.path)) {
    return next();
  }
  return authMiddleware(c, next);
});

// ── Health check (public) ───────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ──────────────────────────────────────────────────

app.route('/api/cases', casesRoutes);
app.route('/api', uploadRoutes);
app.route('/api', analyseRoutes);
app.route('/api', voiceRoutes);
app.route('/api', letterRoutes);
app.route('/api', translateRoutes);
app.route('/api', evidencePackRoutes);
app.route('/api/stripe', stripeRoutes);
app.route('/api/users', usersRoutes);

// ── 404 ─────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ── Error handler ───────────────────────────────────────────

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// ── Exports ─────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
