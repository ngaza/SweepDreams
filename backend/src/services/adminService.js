import { ServiceError } from "./serviceError.js";
import { publicBooking } from "../shared/utils/booking.js";
export function createAdminService(bookings) {
  const listAdminBookings = async () => {
    return (await bookings.find().sort({ createdAt: -1 }).toArray()).map(
      publicBooking,
    );
  };
  const cancelAdminBooking = async (id, body) => {
    try {
      const b = await bookings.findOne({ id });
      if (!b) throw new ServiceError(404, "Booking not found.");
      const { status } = body;
      if (
        status !== "cancelled" ||
        !["pending", "confirmed"].includes(b.status)
      )
        throw new ServiceError(
          409,
          "Only the assigned worker can accept or complete a booking.",
        );
      const update = { status };
      const r = await bookings.updateOne(
        { id: b.id, status: b.status },
        { $set: update },
      );
      if (!r.modifiedCount)
        throw new ServiceError(409, "Booking changed. Refresh and try again.");
      return publicBooking(await bookings.findOne({ id: b.id }));
    } catch (e) {
      if (e.code === 11000)
        throw new ServiceError(
          409,
          "Another booking is confirmed for this slot.",
        );
      throw e;
    }
  };
  return { listAdminBookings, cancelAdminBooking };
}
