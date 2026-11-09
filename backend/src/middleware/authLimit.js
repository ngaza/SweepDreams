export function createAuthLimiter() {
  const limits = new Map();
  const limit = (req, res, next) => {
    const now = Date.now();
    for (const [ip, v] of limits) if (v.until < now) limits.delete(ip);
    const ip = req.ip;
    const v = limits.get(ip) || { count: 0, until: now + 600000 };
    v.count++;
    limits.set(ip, v);
    if (v.count > 30)
      return res
        .status(429)
        .json({ error: "Too many attempts. Please try again in ten minutes." });
    next();
  };
  return limit;
}