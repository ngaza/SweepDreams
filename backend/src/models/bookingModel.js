export async function createBookingModel(db) {
  const bookings = db.collection("bookings");
  await bookings.createIndex({ id: 1 }, { unique: true });
  // Preserve the pilot's one-reservation-per-slot constraint.
  await bookings.createIndex(
    { date: 1, time: 1 },
    { unique: true, partialFilterExpression: { status: "confirmed" } },
  );
  await bookings.createIndex(
    { date: 1, time: 1 },
    {
      name: "reserved_slots",
      unique: true,
      partialFilterExpression: { status: { $in: ["confirmed", "completed"] } },
    },
  );
  return bookings;
}