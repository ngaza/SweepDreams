const workerFields = { _id: 0, id: 1, room: 1, date: 1, time: 1, service: 1, price: 1, status: 1 };

export function createCleanerController(bookings) {
  const available = async (req, res, next) => {
    try {
      const address = typeof req.query.address === "string" ? req.query.address.trim() : "";
      const room = address ? { $regex: escapeRegex(address), $options: "i" } : { $exists: true };
      const rows = await bookings.find({ status: "pending", cleanerId: null, room })
        .project(workerFields).sort({ date: 1, time: 1 }).toArray();
      res.json(rows);
    } catch (error) { next(error); }
  };

  const accepted = async (req, res, next) => {
    try {
      const rows = await bookings.find({ cleanerId: req.user.id, status: { $in: ["confirmed", "completed"] } })
        .project(workerFields).sort({ date: 1, time: 1 }).toArray();
      res.json(rows);
    } catch (error) { next(error); }
  };

  const accept = async (req, res, next) => {
    try {
      const result = await bookings.findOneAndUpdate(
        { id: req.params.id, status: "pending", cleanerId: null },
        { $set: { status: "confirmed", cleanerId: req.user.id, cleaner: req.user.name, acceptedAt: new Date().toISOString() } },
        { returnDocument: "after", projection: workerFields },
      );
      const booking = result?.value ?? result;
      if (!booking) return res.status(409).json({ error: "This booking was already accepted or is no longer available." });
      res.json(booking);
    } catch (error) { next(error); }
  };

  return { available, accepted, accept };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
