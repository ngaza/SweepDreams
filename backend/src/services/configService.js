import { ServiceError } from "./serviceError.js";
import {
  checklist,
  prices,
  addons,
  payments,
  services,
  slots,
} from "../shared/config/services.js";
import { dateToday } from "../shared/utils/date.js";
export function createConfigService(bookings) {
  const getConfig = () => ({
    prices,
    services,
    addons: Object.entries(addons).map(([id, a]) => ({ id, ...a })),
    paymentMethods: payments,
    slots,
    checklist,
    today: dateToday(),
    demo: process.argv.includes("--demo"),
  });
  const getAvailability = async (date) => {
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date <= dateToday()
    )
      throw new ServiceError(400, "Choose a valid future date.");
    const occupied = await bookings
      .find({ date, status: { $in: ["confirmed", "completed"] } })
      .project({ time: 1, _id: 0 })
      .toArray();
    return {
      date,
      slots: slots.filter((slot) => !occupied.some((b) => b.time === slot)),
    };
  };
  return { getConfig, getAvailability };
}
