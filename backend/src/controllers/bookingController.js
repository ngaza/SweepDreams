import { randomBytes } from "node:crypto";
import {
  prices,
  addons,
  paymentIds,
  services,
  slots,
} from "../config/services.js";
import { dateToday } from "../utils/date.js";
import { publicBooking } from "../utils/booking.js";
export function createBookingController(bookings) {
  const createBooking = async (req, res, next) => {
    try {
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
      } = req.body;
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
          (v) =>
            typeof v === "string" && v.trim().length >= 2 && v.length <= 100,
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
        return res
          .status(400)
          .json({
            error:
              "Complete all fields and choose a valid date from tomorrow onward.",
          });
      if (
        await bookings.findOne({
          date,
          time,
          status: { $in: ["confirmed", "completed"] },
        })
      )
        return res
          .status(409)
          .json({
            error: "This slot is already confirmed. Choose another slot.",
          });
      const price =
        (service.sized ? prices[size] : service.price) +
        chosen.reduce((sum, id) => sum + addons[id].price, 0);
      const b = {
        userId: req.user.id,
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
      res.status(201).json(publicBooking(b));
    } catch (e) {
      next(e);
    }
  };
  const listAccountBookings = async (req, res, next) => {
    try {
      res.json(
        (
          await bookings
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .toArray()
        ).map(publicBooking),
      );
    } catch (e) {
      next(e);
    }
  };
  const getBooking = (req, res) => res.json(publicBooking(req.booking));
  const cancelBooking = async (req, res, next) => {
    try {
      const r = await bookings.updateOne(
        {
          id: req.params.id,
          userId: req.user.id,
          status: { $in: ["pending", "confirmed"] },
        },
        { $set: { status: "cancelled" } },
      );
      if (!r.modifiedCount)
        return res
          .status(409)
          .json({
            error: "Only pending or confirmed bookings can be cancelled.",
          });
      res.json(publicBooking(await bookings.findOne({ id: req.params.id })));
    } catch (e) {
      next(e);
    }
  };
  const submitFeedback = async (req, res, next) => {
    try {
      const { rating, comment = "" } = req.body;
      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        typeof comment !== "string" ||
        comment.length > 500
      )
        return res
          .status(400)
          .json({
            error:
              "Choose a rating from 1 to 5; comments have a 500-character limit.",
          });
      const r = await bookings.updateOne(
        {
          id: req.params.id,
          userId: req.user.id,
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
        return res
          .status(409)
          .json({ error: "Feedback is available once, after completion." });
      res.json(publicBooking(await bookings.findOne({ id: req.params.id })));
    } catch (e) {
      next(e);
    }
  };
  return {
    createBooking,
    listAccountBookings,
    getBooking,
    cancelBooking,
    submitFeedback,
  };
}
