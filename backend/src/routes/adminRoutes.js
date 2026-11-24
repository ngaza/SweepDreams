import { createAdminController } from "../controllers/adminController.js";
export function installAdminRoutes(app, bookings, access) {
  const { admin } = access;
  const controllers = createAdminController(bookings);
  app.get("/api/admin/bookings", admin, controllers.listAdminBookings);
  app.patch("/api/admin/bookings/:id", admin, controllers.cancelAdminBooking);
}
