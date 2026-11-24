import { publicBooking } from "../utils/booking.js";
export function createAdminController(bookings) {
  const listAdminBookings = async (req, res, next) => {
    try {
      res.json(
        (await bookings.find().sort({ createdAt: -1 }).toArray()).map(
          publicBooking,
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  const cancelAdminBooking = async (req, res, next) => {
    try {
      const b = await bookings.findOne({ id: req.params.id });
      if (!b) return res.status(404).json({ error: "Booking not found." });
      const { status } = req.body;
      if (
        status !== "cancelled" ||
        !["pending", "confirmed"].includes(b.status)
      )
        return res
          .status(409)
          .json({
            error: "Only the assigned worker can accept or complete a booking.",
          });
      const update = { status };
      const r = await bookings.updateOne(
        { id: b.id, status: b.status },
        { $set: update },
      );
      if (!r.modifiedCount)
        return res
          .status(409)
          .json({ error: "Booking changed. Refresh and try again." });
      res.json(publicBooking(await bookings.findOne({ id: b.id })));
    } catch (e) {
      if (e.code === 11000)
        return res
          .status(409)
          .json({ error: "Another booking is confirmed for this slot." });
      next(e);
    }
  };
  return { listAdminBookings, cancelAdminBooking };
}
