export function createBookingAccess(bookings) {
  const requireAuth = (req, res, next) => req.user
    ? next()
    : res.status(401).json({ error: "Please log in first." });

  const requireCleaner = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Please log in first." });
    if (req.user.role !== "cleaner") return res.status(403).json({ error: "Worker access is required." });
    next();
  };

  const assignedWorker = async (req, res, next) => {
    try {
      const booking = await bookings.findOne({ id: req.params.id, cleanerId: req.user.id });
      if (!booking) return res.status(404).json({ error: "Booking not found." });
      req.booking = booking;
      next();
    } catch (error) {
      next(error);
    }
  };

  return { requireAuth, requireCleaner, assignedWorker };
}
