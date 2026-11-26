import { ServiceError } from "./serviceError.js";
import { checklist } from "../shared/config/services.js";
import { dateToday } from "../shared/utils/date.js";
import { publicBooking } from "../shared/utils/booking.js";
export function createCleanerService(bookings) {
  const listCleanerBookings = async (user) => {
    const rows = await bookings
      .find({
        $or: [
          { status: "pending", date: { $gt: dateToday() } },
          { cleanerId: user.id },
        ],
      })
      .sort({ date: 1, time: 1 })
      .toArray();
    return rows.map((b) =>
      b.cleanerId === user.id
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
    );
  };
  const acceptBooking = async (id, user) => {
    try {
      const b = await bookings.findOneAndUpdate(
        { id, status: "pending", date: { $gt: dateToday() } },
        {
          $set: {
            status: "confirmed",
            cleanerId: user.id,
            cleaner: user.name,
            acceptedAt: new Date().toISOString(),
          },
        },
        { returnDocument: "after" },
      );
      if (!b)
        throw new ServiceError(
          409,
          "This request is no longer available. Refresh the list.",
        );
      return publicBooking(b);
    } catch (e) {
      if (e.code === 11000)
        throw new ServiceError(
          409,
          "This time slot is already reserved. Choose another request.",
        );
      throw e;
    }
  };
  const saveProgress = async (id, user, body) => {
    const { completedChecklist } = body || {};
    if (
      !Array.isArray(completedChecklist) ||
      completedChecklist.length > checklist.length ||
      new Set(completedChecklist).size !== completedChecklist.length ||
      completedChecklist.some((c) => !checklist.includes(c))
    )
      throw new ServiceError(400, "Choose valid checklist items.");
    const b = await bookings.findOneAndUpdate(
      { id, cleanerId: user.id, status: "confirmed" },
      {
        $set: {
          completedChecklist,
          progressUpdatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    );
    if (!b)
      throw new ServiceError(
        409,
        "Only your confirmed bookings can be updated.",
      );
    return publicBooking(b);
  };
  const uploadProof = async (id, user, body) => {
    const { image, task } = body || {};
    if (!Number.isInteger(task) || task < 0 || task >= checklist.length)
      throw new ServiceError(400, "Choose a valid checklist task.");
    const match =
      typeof image === "string" &&
      image.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match)
      throw new ServiceError(400, "Upload a JPEG or PNG photo up to 1 MB.");
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
      throw new ServiceError(
        400,
        "Upload a valid JPEG or PNG photo up to 1 MB.",
      );
    const b = await bookings.findOneAndUpdate(
      { id, cleanerId: user.id, status: "confirmed" },
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
      throw new ServiceError(
        409,
        "Only your confirmed bookings can be updated.",
      );
    return publicBooking(b);
  };
  const completeBooking = async (id, user) => {
    const b = await bookings.findOneAndUpdate(
      {
        id,
        cleanerId: user.id,
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
      throw new ServiceError(
        409,
        "Complete your saved checklist and upload a proof photo for every task before completing this booking.",
      );
    return publicBooking(b);
  };
  return {
    listCleanerBookings,
    acceptBooking,
    saveProgress,
    uploadProof,
    completeBooking,
  };
}
