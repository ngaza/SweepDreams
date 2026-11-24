import { checklist } from "../config/services.js";
import { dateToday } from "../utils/date.js";
import { publicBooking } from "../utils/booking.js";
export function createCleanerController(bookings) {
  const listCleanerBookings = async (req, res, next) => {
    try {
      const rows = await bookings
        .find({
          $or: [
            { status: "pending", date: { $gt: dateToday() } },
            { cleanerId: req.user.id },
          ],
        })
        .sort({ date: 1, time: 1 })
        .toArray();
      res.json(
        rows.map((b) =>
          b.cleanerId === req.user.id
            ? publicBooking(b)
            : {
                id: b.id,
                date: b.date,
                time: b.time,
                room: b.room,
                service: b.service,
                price: b.price,
                status: b.status,
              },
        ),
      );
    } catch (e) {
      next(e);
    }
  };
  const acceptBooking = async (req, res, next) => {
    try {
      const b = await bookings.findOneAndUpdate(
        { id: req.params.id, status: "pending", date: { $gt: dateToday() } },
        {
          $set: {
            status: "confirmed",
            cleanerId: req.user.id,
            cleaner: req.user.name,
            acceptedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );
      if (!b)
        return res
          .status(409)
          .json({
            error: "This request is no longer available. Refresh the list.",
          });
      res.json(publicBooking(b));
    } catch (e) {
      if (e.code === 11000)
        return res
          .status(409)
          .json({
            error:
              "This time slot is already reserved. Choose another request.",
          });
      next(e);
    }
  };
  const saveProgress = async (req, res, next) => {
    try {
      const { completedChecklist } = req.body || {};
      if (
        !Array.isArray(completedChecklist) ||
        completedChecklist.length > checklist.length ||
        new Set(completedChecklist).size !== completedChecklist.length ||
        completedChecklist.some((c) => !checklist.includes(c))
      )
        return res.status(400).json({ error: "Choose valid checklist items." });
      const b = await bookings.findOneAndUpdate(
        { id: req.params.id, cleanerId: req.user.id, status: "confirmed" },
        {
          $set: {
            completedChecklist,
            progressUpdatedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );
      if (!b)
        return res
          .status(409)
          .json({ error: "Only your confirmed bookings can be updated." });
      res.json(publicBooking(b));
    } catch (e) {
      next(e);
    }
  };
  const uploadProof = async (req, res, next) => {
    try {
      const { image, task } = req.body || {};
      if (!Number.isInteger(task) || task < 0 || task >= checklist.length)
        return res
          .status(400)
          .json({ error: "Choose a valid checklist task." });
      const match =
        typeof image === "string" &&
        image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match)
        return res
          .status(400)
          .json({ error: "Upload a JPEG or PNG photo up to 1 MB." });
      const bytes = Buffer.from(match[2], "base64");
      const valid =
        match[1] === "jpeg"
          ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
          : bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      if (
        !valid ||
        bytes.length > 1024 * 1024 ||
        bytes.toString("base64") !== match[2]
      )
        return res
          .status(400)
          .json({ error: "Upload a valid JPEG or PNG photo up to 1 MB." });
      const b = await bookings.findOneAndUpdate(
        { id: req.params.id, cleanerId: req.user.id, status: "confirmed" },
        {
          $set: {
            [`taskProofs.${task}`]: {
              image,
              uploadedAt: new Date().toISOString(),
            },
          },
        },
        { returnDocument: "after" },
      );
      if (!b)
        return res
          .status(409)
          .json({ error: "Only your confirmed bookings can be updated." });
      res.json(publicBooking(b));
    } catch (e) {
      next(e);
    }
  };
  const completeBooking = async (req, res, next) => {
    try {
      const b = await bookings.findOneAndUpdate(
        {
          id: req.params.id,
          cleanerId: req.user.id,
          status: "confirmed",
          completedChecklist: { $all: checklist },
          ...Object.fromEntries(
            checklist.map((_, i) => [
              "taskProofs." + i + ".image",
              { $exists: true },
            ]),
          ),
        },
        {
          $set: { status: "completed", completedAt: new Date().toISOString() },
        },
        { returnDocument: "after" },
      );
      if (!b)
        return res
          .status(409)
          .json({
            error:
              "Complete your saved checklist and upload a proof photo for every task before completing this booking.",
          });
      res.json(publicBooking(b));
    } catch (e) {
      next(e);
    }
  };
  return {
    listCleanerBookings,
    acceptBooking,
    saveProgress,
    uploadProof,
    completeBooking,
  };
}