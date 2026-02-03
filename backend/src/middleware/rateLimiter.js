import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config/config.js';

const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.points,
  duration: config.rateLimit.durationSeconds,
  blockDuration: config.rateLimit.blockSeconds,
});

export const rateLimiterMiddleware = async (req, res, next) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim();
  const key = forwardedIp || req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    await rateLimiter.consume(key, 1);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
  }
};
