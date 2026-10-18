/**
 * In-memory Rate Limiting Middleware.
 * Tailored for high-concurrency educational environments (e.g. 500-800+ students
 * sharing a single school WiFi / NAT IP).
 *
 * Implements:
 * 1. Loose per-IP limits for school WiFi NAT networks (1200 req/min).
 * 2. Combined email+IP rate limiting with progressive delay (prevents classmate lockouts).
 */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown-ip';
}

class TokenBucketRateLimiter {
  constructor({
    windowMs = 60000,
    max = 300,
    keyGenerator = null,
    message = 'Too many requests',
    progressiveDelay = false,
  }) {
    this.windowMs = windowMs;
    this.max = max;
    this.keyGenerator = keyGenerator || ((req) => getClientIp(req));
    this.message = message;
    this.progressiveDelay = progressiveDelay;
    this.hits = new Map();

    // Purge expired windows every minute
    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - this.windowMs;
      for (const [key, data] of this.hits.entries()) {
        if (data.resetTime < cutoff) {
          this.hits.delete(key);
        }
      }
    }, 60000);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();
      let record = this.hits.get(key);

      if (!record || record.resetTime <= now) {
        record = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.hits.set(key, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.message,
          retryAfter: resetSeconds,
        });
      }

      // Progressive delay to slow down automated rapid attempts without hard lockout
      if (this.progressiveDelay && record.count > 5) {
        const delayMs = Math.min((record.count - 5) * 400, 3000);
        return setTimeout(next, delayMs);
      }

      next();
    };
  }
}

// 1. General API Limiter (1200 requests / min per IP)
const generalLimiter = new TokenBucketRateLimiter({
  windowMs: 60000,
  max: 1200,
  message: 'Too many requests. Please slow down and try again shortly.',
}).middleware();

// 2. School-Friendly Auth Limiter:
// - Generous 1200 req/min per IP so an entire school on a single NAT IP is never blocked
const schoolIpAuthLimiter = new TokenBucketRateLimiter({
  windowMs: 60000,
  max: 1200,
  keyGenerator: (req) => getClientIp(req),
  message: 'School network request limit reached. Please wait a moment and try again.',
}).middleware();

// 3. Email + IP Protection Limiter:
// - Keys strictly by (Email + IP) to prevent malicious classmates from locking out other students.
// - Features progressive delay after 5 failed attempts, capping at 20 attempts/min from that IP.
const emailIpBruteForceLimiter = new TokenBucketRateLimiter({
  windowMs: 60000,
  max: 20,
  progressiveDelay: true,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').trim().toLowerCase();
    const ip = getClientIp(req);
    return `auth:${email || 'generic'}:${ip}`;
  },
  message: 'Too many login attempts from this device for this account. Please wait 1 minute before trying again.',
}).middleware();

const authLimiter = (req, res, next) => {
  schoolIpAuthLimiter(req, res, (err) => {
    if (err) return next(err);
    emailIpBruteForceLimiter(req, res, next);
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
};
