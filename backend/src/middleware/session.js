import { digest, cookieToken } from "../utils/auth.js";
export function createSessionMiddleware(users, sessions) {
  return async (req, res, next) => {
    try {
      if (
        !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
        req.headers.origin &&
        req.headers.origin !== req.protocol + "://" + req.get("host")
      )
        return res
          .status(403)
          .json({ error: "Please submit from this website." });
      const token = cookieToken(req);
      if (token) {
        const session = await sessions.findOne({
          tokenHash: digest(token),
          expiresAt: { $gt: new Date() },
        });
        if (session) req.user = await users.findOne({ id: session.userId });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}