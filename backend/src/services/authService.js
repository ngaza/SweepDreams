import { ServiceError } from "./serviceError.js";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { scrypt, digest, safe } from "../shared/utils/auth.js";
export function createAuthService(users, sessions) {
  async function createSession(user, previousToken) {
    if (previousToken) {
      await sessions.deleteOne({ tokenHash: digest(previousToken) });
    }
    const token = randomBytes(32).toString("hex");
    await sessions.insertOne({
      tokenHash: digest(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });
    return { user: safe(user), token };
  }
  const signup = async (body, previousToken) => {
    try {
      const { name, email, password, role = "customer" } = body || {};
      if (!["customer", "cleaner"].includes(role))
        throw new ServiceError(400, "Choose Customer or Cleaner.");
      if (role !== "customer")
        throw new ServiceError(
          403,
          "Worker accounts are created by an administrator.",
        );
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
        throw new ServiceError(
          400,
          "Enter your name, a valid email, and a password of 8–128 characters.",
        );
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
      return await createSession(user, previousToken);
    } catch (e) {
      if (e.code === 11000)
        throw new ServiceError(
          409,
          "This email already has an account. Please log in.",
        );
      throw e;
    }
  };
  const listWorkers = async () => {
    const workers = await users
      .find({ role: "cleaner" })
      .project({ id: 1, name: 1, email: 1, role: 1, _id: 0 })
      .sort({ name: 1, email: 1 })
      .toArray();
    return workers.map(safe);
  };
  const createWorker = async (body) => {
    try {
      const { name, email, password } = body || {};
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
        throw new ServiceError(
          400,
          "Enter your name, a valid email, and a password of 8–128 characters.",
        );
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
      return { user: safe(user) };
    } catch (e) {
      if (e.code === 11000)
        throw new ServiceError(409, "This email already has an account.");
      throw e;
    }
  };
  const login = async (body, previousToken) => {
    const { email, password, role = "customer" } = body || {};
    if (!["customer", "cleaner"].includes(role))
      throw new ServiceError(400, "Choose Customer or Cleaner.");
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 128
    )
      throw new ServiceError(400, "Enter your email and password.");
    const user = await users.findOne({ email: email.trim().toLowerCase() });
    const hash = await scrypt(password, user?.salt || "missing-user-salt", 64);
    if (!user || !timingSafeEqual(hash, Buffer.from(user.passwordHash, "hex")))
      throw new ServiceError(401, "Email or password is incorrect.");
    if ((user.role || "customer") !== role)
      throw new ServiceError(
        403,
        "Choose the account type you registered with.",
      );
    return createSession(user, previousToken);
  };
  const logout = async (token) => {
    if (token) await sessions.deleteOne({ tokenHash: digest(token) });
    return { ok: true };
  };
  return { signup, listWorkers, createWorker, login, logout };
}
