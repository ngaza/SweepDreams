import {
  checklist,
  prices,
  addons,
  payments,
  services,
  slots,
} from "../config/services.js";
import { dateToday } from "../utils/date.js";
export function createConfigController(bookings) {
  const getConfig = (req, res) =>
    res.json({
      prices,
      services,
      addons: Object.entries(addons).map(([id, a]) => ({ id, ...a })),
      paymentMethods: payments,
      slots,
      checklist,
      today: dateToday(),
      demo: process.argv.includes("--demo"),
    });
  const getAvailability = async (req, res, next) => {
    try {
      const { date } = req.query;
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        date <= dateToday()
      )
        return res.status(400).json({ error: "Choose a valid future date." });
      const occupied = await bookings
        .find({ date, status: { $in: ["confirmed", "completed"] } })
        .project({ time: 1, _id: 0 })
        .toArray();
      res.json({
        date,
        slots: slots.filter((slot) => !occupied.some((b) => b.time === slot)),
      });
    } catch (e) {
      next(e);
    }
  };
  return { getConfig, getAvailability };
}