import { createCleanerController } from "./cleanerController.js";
export function installCleanerRoutes(app, bookings, access) {
  const { cleanerOnly } = access;
  const controllers = createCleanerController(bookings);
  app.get(
    "/api/cleaner/bookings",
    cleanerOnly,
    controllers.listCleanerBookings,
  );
  app.post(
    "/api/cleaner/bookings/:id/accept",
    cleanerOnly,
    controllers.acceptBooking,
  );
  app.patch(
    "/api/cleaner/bookings/:id/progress",
    cleanerOnly,
    controllers.saveProgress,
  );
  app.post(
    "/api/cleaner/bookings/:id/proof",
    cleanerOnly,
    controllers.uploadProof,
  );
  app.post(
    "/api/cleaner/bookings/:id/complete",
    cleanerOnly,
    controllers.completeBooking,
  );
}
