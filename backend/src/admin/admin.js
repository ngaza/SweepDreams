export function createAdminGuard(
  adminKey,
  message = "Administrator access is required.",
) {
  return (req, res, next) =>
    req.headers.authorization === `Bearer ${adminKey}`
      ? next()
      : res.status(401).json({ error: message });
}
