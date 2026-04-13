const jwt = require('jsonwebtoken');

const { buildResponse } = require('../utils/apiResponse');

function getPositiveInteger(value, fallback) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getClientIp(request) {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.ip || request.socket?.remoteAddress || 'unknown';
}

function getTokenUserId(request) {
  const [scheme, token] = String(request.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.id || null;
  } catch {
    return null;
  }
}

function createRateLimiter(options = {}) {
  const maxRequests = getPositiveInteger(
    options.maxRequests || process.env.RATE_LIMIT_MAX_REQUESTS,
    100
  );
  const windowMs = getPositiveInteger(
    options.windowMs || process.env.RATE_LIMIT_WINDOW_MS,
    60_000
  );
  const buckets = new Map();

  function cleanupExpiredBuckets(now) {
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }

  return async function rateLimiter(request, reply) {
    if (request.method === 'OPTIONS') {
      return;
    }

    const now = Date.now();
    const userId = getTokenUserId(request);
    const key = userId
      ? `user:${userId}`
      : `ip:${getClientIp(request)}`;

    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + windowMs,
      };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count === 1) {
      cleanupExpiredBuckets(now);
    }

    const remaining = Math.max(maxRequests - bucket.count, 0);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    reply.header('X-RateLimit-Limit', maxRequests);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', resetSeconds);

    if (bucket.count > maxRequests) {
      reply.header('Retry-After', resetSeconds);

      return reply.code(429).send(
        buildResponse(429, 'ExGW429', {
          message: 'Too many requests',
          limit: maxRequests,
          windowMs,
          retryAfterSeconds: resetSeconds,
        })
      );
    }
  };
}

module.exports = {
  createRateLimiter,
};
