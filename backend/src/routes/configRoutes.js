import { createConfigController } from "../controllers/configController.js";
export function installConfigRoutes(app, bookings, access) {
  const controllers = createConfigController(bookings);
  app.get("/api/config", controllers.getConfig);
  app.get("/api/availability", controllers.getAvailability);
}