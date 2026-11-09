import { createBookingController } from "../controllers/bookingController.js";
export function installBookingRoutes(app, bookings, access) {
  const { requireAuth, customer, own } = access;
  const controllers = createBookingController(bookings);
  app.post("/api/bookings", customer, controllers.createBooking);
  app.get(
    "/api/account/bookings",
    requireAuth,
    controllers.listAccountBookings,
  );
  app.get("/api/bookings/:id", own, controllers.getBooking);
  app.post("/api/bookings/:id/cancel", own, controllers.cancelBooking);
  app.post("/api/bookings/:id/feedback", own, controllers.submitFeedback);
}
