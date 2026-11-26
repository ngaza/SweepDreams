import { ServiceError } from "./serviceError.js";
import { randomBytes } from "node:crypto";
import {
  prices,
  addons,
  paymentIds,
  services,
  slots,
} from "../shared/config/services.js";
import { dateToday } from "../shared/utils/date.js";
import { publicBooking } from "../shared/utils/booking.js";
export function createBookingService(bookings) {
  const createBooking = async (body, user) => {
    const {
      name,
      contact,
      room,
      size,
      date,
      time,
      notes = "",
      serviceId = "basic",
      addons: chosen = [],
      paymentMethod = "cash",
    } = body;
    const service = services.find((s) => s.id === serviceId);
    const validDate =
      typeof date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Number.isFinite(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date &&
      date > dateToday();
    const validAddons =
      Array.isArray(chosen) &&
      new Set(chosen).size === chosen.length &&
      chosen.every((id) => Object.hasOwn(addons, id));
    if (
      ![name, contact, room].every(
        (v) => typeof v === "string" && v.trim().length >= 2 && v.length <= 100,
      ) ||
      !service ||
      (service.sized && !Object.hasOwn(prices, size)) ||
      !slots.includes(time) ||
      !validDate ||
      typeof notes !== "string" ||
      notes.length > 500 ||
      !validAddons ||
      !paymentIds.includes(paymentMethod)
    )
      throw new ServiceError(
        400,
        "Complete all fields and choose a valid date from tomorrow onward.",
      );
    if (
      await bookings.findOne({
        date,
        time,
        status: { $in: ["confirmed", "completed"] },
      })
    )
      throw new ServiceError(
        409,
        "This slot is already confirmed. Choose another slot.",
      );
    const price =
      (service.sized ? prices[size] : service.price) +
      chosen.reduce((sum, id) => sum + addons[id].price, 0);
    const b = {
      userId: user.id,
      id: randomBytes(5).toString("hex").toUpperCase(),
      name: name.trim(),
      contact: contact.trim(),
      room: room.trim(),
      size: service.sized ? size : null,
      date,
      time,
      notes: notes.trim(),
      price,
      service: service.name,
      serviceId: service.id,
      addons: chosen.map((id) => ({
        id,
        name: addons[id].name,
        price: addons[id].price,
      })),
      paymentMethod,
      status: "pending",
      cleaner: null,
      completedChecklist: [],
      createdAt: new Date().toISOString(),
    };
    await bookings.insertOne(b);
    return publicBooking(b);
  };
  const listAccountBookings = async (user) => {
    return (
      await bookings.find({ userId: user.id }).sort({ createdAt: -1 }).toArray()
    ).map(publicBooking);
  };
  const getBooking = (booking) => publicBooking(booking);
  const cancelBooking = async (id, user) => {
    const r = await bookings.updateOne(
      {
        id,
        userId: user.id,
        status: { $in: ["pending", "confirmed"] },
      },
      { $set: { status: "cancelled" } },
    );
    if (!r.modifiedCount)
      throw new ServiceError(
        409,
        "Only pending or confirmed bookings can be cancelled.",
      );
    return publicBooking(await bookings.findOne({ id }));
  };
  const submitFeedback = async (id, user, body) => {
    const { rating, comment = "" } = body;
    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof comment !== "string" ||
      comment.length > 500
    )
      throw new ServiceError(
        400,
        "Choose a rating from 1 to 5; comments have a 500-character limit.",
      );
    const r = await bookings.updateOne(
      {
        id,
        userId: user.id,
        status: "completed",
        feedback: { $exists: false },
      },
      {
        $set: {
          feedback: {
            rating,
            comment: comment.trim(),
            createdAt: new Date().toISOString(),
          },
        },
      },
    );
    if (!r.modifiedCount)
      throw new ServiceError(
        409,
        "Feedback is available once, after completion.",
      );
    return publicBooking(await bookings.findOne({ id }));
  };
  return {
    createBooking,
    listAccountBookings,
    getBooking,
    cancelBooking,
    submitFeedback,
  };
}
