import { scrypt as derive, createHash } from "node:crypto";
import { promisify } from "node:util";
export const scrypt = promisify(derive);
export const digest = (token) =>
  createHash("sha256").update(token).digest("hex");
export const safe = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || "customer",
});
export const cookieToken = (req) =>
  req.headers.cookie
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("sweep_session="))
    ?.slice(14);
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 86400000,
};