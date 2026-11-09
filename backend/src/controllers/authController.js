import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  scrypt,
  digest,
  safe,
  cookieToken,
  cookieOptions,
} from "../utils/auth.js";
export function createAuthController(users, sessions) {
  async function session(req, res, user) {
    const old = cookieToken(req);
    if (old) await sessions.deleteOne({ tokenHash: digest(old) });
    const token = randomBytes(32).toString("hex");
    await sessions.insertOne({
      tokenHash: digest(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
    res.cookie("sweep_session", token, cookieOptions);
    return safe(user);
  }
  const me = (req, res) => res.json({ user: req.user ? safe(req.user) : null });
  const signup = async (req, res, next) => {
    try {
      const { name, email, password, role = "customer" } = req.body || {};
      if (!["customer", "cleaner"].includes(role))
        return res.status(400).json({ error: "Choose Customer or Cleaner." });
      if (role !== "customer")
        return res
          .status(403)
          .json({ error: "Worker accounts are created by an administrator." });
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.length > 100 ||
        typeof email !== "string" ||
        email.length > 254 ||
        !/^\S+@\S+\.\S+$/.test(email.trim()) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      )
        return res
          .status(400)
          .json({
            error:
              "Enter your name, a valid email, and a password of 8–128 characters.",
          });
      const salt = randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
      const user = {
        id: randomBytes(16).toString("hex"),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        salt,
        passwordHash,
        role,
        createdAt: new Date(),
      };
      await users.insertOne(user);
      res.status(201).json({ user: await session(req, res, user) });
    } catch (e) {
      if (e.code === 11000)
        return res
          .status(409)
          .json({ error: "This email already has an account. Please log in." });
      next(e);
    }
  };
  const listWorkers = async (req, res, next) => {
    try {
      const workers = await users
        .find({ role: "cleaner" })
        .project({ id: 1, name: 1, email: 1, role: 1, _id: 0 })
        .sort({ name: 1, email: 1 })
        .toArray();
      res.json(workers.map(safe));
    } catch (e) {
      next(e);
    }
  };
  const createWorker = async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};
      const role = "cleaner";
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.length > 100 ||
        typeof email !== "string" ||
        email.length > 254 ||
        !/^\S+@\S+\.\S+$/.test(email.trim()) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128
      )
        return res
          .status(400)
          .json({
            error:
              "Enter your name, a valid email, and a password of 8–128 characters.",
          });
      const salt = randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");
      const user = {
        id: randomBytes(16).toString("hex"),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        salt,
        passwordHash,
        role,
        createdAt: new Date(),
      };
      await users.insertOne(user);
      res.status(201).json({ user: safe(user) });
    } catch (e) {
      if (e.code === 11000)
        return res
          .status(409)
          .json({ error: "This email already has an account." });
      next(e);
    }
  };
  const login = async (req, res, next) => {
    try {
      const { email, password, role = "customer" } = req.body || {};
      if (!["customer", "cleaner"].includes(role))
        return res.status(400).json({ error: "Choose Customer or Cleaner." });
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        email.length > 254 ||
        password.length > 128
      )
        return res
          .status(400)
          .json({ error: "Enter your email and password." });
      const user = await users.findOne({ email: email.trim().toLowerCase() });
      const hash = await scrypt(
        password,
        user?.salt || "missing-user-salt",
        64,
      );
      if (
        !user ||
        !timingSafeEqual(hash, Buffer.from(user.passwordHash, "hex"))
      )
        return res
          .status(401)
          .json({ error: "Email or password is incorrect." });
      if ((user.role || "customer") !== role)
        return res
          .status(403)
          .json({ error: "Choose the account type you registered with." });
      res.json({ user: await session(req, res, user) });
    } catch (e) {
      next(e);
    }
  };
  const logout = async (req, res, next) => {
    try {
      const token = cookieToken(req);
      if (token) await sessions.deleteOne({ tokenHash: digest(token) });
      res.clearCookie("sweep_session", {
        httpOnly: true,
        sameSite: "lax",
        secure: cookieOptions.secure,
        path: "/",
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  };
  return { me, signup, listWorkers, createWorker, login, logout };
}