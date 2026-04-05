import * as Sentry from '@sentry/react';

/**
 * Initialise Sentry for error and performance tracking.
 * Call once in main.tsx before rendering.
 *
 * DSN comes from environment — never hardcoded.
 * In development (localhost), Sentry is disabled to avoid noise.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip in development or if DSN not configured
  if (!dsn || window.location.hostname === 'localhost') {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `rentshield@${import.meta.env.VITE_APP_VERSION ?? '0.1.0'}`,

    // Performance — sample 20% of transactions in production
    tracesSampleRate: 0.2,

    // Session replay — capture 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noisy errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Load failed',
      'NetworkError',
    ],

    // Strip PII from breadcrumbs — GDPR compliant
    beforeBreadcrumb(breadcrumb) {
      // Don't log URL params (could contain email, case IDs)
      if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
        const url = new URL(breadcrumb.data.to, window.location.origin);
        url.search = '';
        breadcrumb.data.to = url.pathname;
      }
      return breadcrumb;
    },

    // Strip PII from error events
    beforeSend(event) {
      // Remove user IP
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

/**
 * Set Sentry user context after Clerk auth.
 * Only sets anonymous ID — never email or name.
 */
export function setSentryUser(userId: string): void {
  Sentry.setUser({ id: userId });
}

/**
 * Clear Sentry user context on logout.
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}
