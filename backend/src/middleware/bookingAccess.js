import { createAdminGuard } from "./admin.js";
export function createBookingAccess(bookings, adminKey) {
  const admin = createAdminGuard(
    adminKey,
    "Enter the correct administrator key.",
  );
  const requireAuth = (req, res, next) =>
    req.user
      ? next()
      : res
          .status(401)
          .json({ error: "Please log in or sign up to book a clean." });
  const customer = (req, res, next) =>
    !req.user
      ? requireAuth(req, res, next)
      : (req.user.role || "customer") === "customer"
        ? next()
        : res
            .status(403)
            .json({ error: "Only customer accounts can book a clean." });
  const cleanerOnly = (req, res, next) =>
    !req.user
      ? res.status(401).json({ error: "Please log in as a cleaner." })
      : req.user.role === "cleaner"
        ? next()
        : res.status(403).json({ error: "A cleaner account is required." });
  const own = async (req, res, next) => {
    try {
      if (!req.user)
        return res
          .status(401)
          .json({ error: "Please log in to view your bookings." });
      req.booking = await bookings.findOne({
        id: req.params.id,
        userId: req.user.id,
      });
      if (!req.booking)
        return res.status(404).json({ error: "Booking not found." });
      next();
    } catch (e) {
      next(e);
    }
  };
  return { admin, requireAuth, customer, cleanerOnly, own };
}
