import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // max 20 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
});
