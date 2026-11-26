import { createAdminGuard } from "../middleware/admin.js";
import { createUserModel } from "../models/userModel.js";
import { createSessionMiddleware } from "../middleware/session.js";
import { createAuthLimiter } from "../middleware/authLimit.js";
import { createAuthController } from "../controllers/authController.js";
export async function installAuth(app, db, adminKey) {
  const { users, sessions } = await createUserModel(db);
  app.use("/api", createSessionMiddleware(users, sessions));
  const limit = createAuthLimiter();
  const workerAdmin = createAdminGuard(adminKey);
  const controllers = createAuthController(users, sessions);
  app.get("/api/auth/me", controllers.me);
  app.post("/api/auth/signup", limit, controllers.signup);
  app.get("/api/admin/workers", workerAdmin, controllers.listWorkers);
  app.post("/api/admin/workers", workerAdmin, limit, controllers.createWorker);
  app.post("/api/auth/login", limit, controllers.login);
  app.post("/api/auth/logout", controllers.logout);
}
