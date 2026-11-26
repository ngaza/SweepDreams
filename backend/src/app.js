import express from "express";
import { installAuth } from "./shared/routes/authRoutes.js";
import { createBookingModel } from "./shared/models/bookingModel.js";
import { createBookingAccess } from "./shared/middleware/bookingAccess.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import { installConfigRoutes } from "./shared/routes/configRoutes.js";
import { installBookingRoutes } from "./user/bookingRoutes.js";
import { installCleanerRoutes } from "./cleaner/cleanerRoutes.js";
import { installAdminRoutes } from "./admin/adminRoutes.js";
export { checklist } from "./shared/config/services.js";

export async function createApp(db, adminKey) {
  const app = express();
  app.use("/api/cleaner/bookings/:id/proof", express.json({ limit: "1500kb" }));
  app.use(express.json({ limit: "16kb" }));
  await installAuth(app, db, adminKey);
  const bookings = await createBookingModel(db);
  const access = createBookingAccess(bookings, adminKey);
  installConfigRoutes(app, bookings, access);
  installBookingRoutes(app, bookings, access);
  installCleanerRoutes(app, bookings, access);
  installAdminRoutes(app, bookings, access);
  app.use(errorHandler);
  return app;
}
