import { createAuthService } from "../../services/authService.js";
import { safe, cookieToken, cookieOptions } from "../utils/auth.js";

export function createAuthController(users, sessions) {
  const service = createAuthService(users, sessions);

  const me = (req, res) => res.json({ user: req.user ? safe(req.user) : null });

  const signup = async (req, res) => {
    const { user, token } = await service.signup(req.body, cookieToken(req));
    res.cookie("sweep_session", token, cookieOptions);
    res.status(201).json({ user });
  };

  const listWorkers = async (req, res) => {
    res.json(await service.listWorkers());
  };

  const createWorker = async (req, res) => {
    res.status(201).json(await service.createWorker(req.body));
  };

  const login = async (req, res) => {
    const { user, token } = await service.login(req.body, cookieToken(req));
    res.cookie("sweep_session", token, cookieOptions);
    res.json({ user });
  };

  const logout = async (req, res) => {
    const result = await service.logout(cookieToken(req));
    res.clearCookie("sweep_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieOptions.secure,
      path: "/",
    });
    res.json(result);
  };

  return { me, signup, listWorkers, createWorker, login, logout };
}
