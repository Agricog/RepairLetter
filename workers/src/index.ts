import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { casesRoutes } from './routes/cases';
import { uploadRoutes } from './routes/upload';
import { analyseRoutes } from './routes/analyse';
import { voiceRoutes } from './routes/voice';
import { letterRoutes } from './routes/letter';
import { stripeRoutes } from './routes/stripe';
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

// CORS — locked to production domain + localhost for dev
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      const allowed = [
        'https://rentshield.co.uk',
        'https://www.rentshield.co.uk',
      ];
      // Allow localhost in development only
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

// Body size limits — prevent oversized payloads
app.use('/api/*', bodyLimit({ maxSize: 15 * 1024 * 1024 })); // 15MB max (photos up to 10MB + overhead)

// Auth on all /api routes except Stripe webhooks
app.use('/api/*', async (c, next) => {
  // Stripe webhook has its own signature verification
  if (c.req.path === '/api/stripe/webhook') {
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
app.route('/api/stripe', stripeRoutes);

// ── 404 ─────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: 'Not found' }, 404));

// ── Error handler ───────────────────────────────────────────

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  // Never expose internal error details to client
  return c.json({ error: 'Internal server error' }, 500);
});

// ── Exports ─────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
