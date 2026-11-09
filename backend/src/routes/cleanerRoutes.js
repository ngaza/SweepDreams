import { createCleanerController } from "../controllers/cleanerController.js";

export function installCleanerRoutes(app, bookings, access) {
  const controller = createCleanerController(bookings);
  app.get("/api/cleaner/bookings", access.requireCleaner, controller.available);
  app.get("/api/cleaner/bookings/accepted", access.requireCleaner, controller.accepted);
  app.post("/api/cleaner/bookings/:id/accept", access.requireCleaner, controller.accept);
}
