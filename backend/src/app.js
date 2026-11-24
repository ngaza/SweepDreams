import express from "express";
import { installAuth } from "./routes/authRoutes.js";
import { createBookingModel } from "./models/bookingModel.js";
import { createBookingAccess } from "./middleware/bookingAccess.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { installConfigRoutes } from "./routes/configRoutes.js";
import { installBookingRoutes } from "./routes/bookingRoutes.js";
import { installCleanerRoutes } from "./routes/cleanerRoutes.js";
import { installAdminRoutes } from "./routes/adminRoutes.js";
export { checklist } from "./config/services.js";

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