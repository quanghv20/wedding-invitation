import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { NextRequest } from "next/server";
import { getValue } from "./db";

const scryptAsync = promisify(scrypt) as (password: string, salt: string, length: number) => Promise<Buffer>;

export type AdminAccount = { username: string; passwordHash: string };

export const SESSION_COOKIE = "wedding_admin";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return safeEqual(await scryptAsync(password, salt, 64), Buffer.from(hash, "hex"));
}

export const getAdminAccount = () => getValue<AdminAccount>("admin");

/** Khóa ký chính là mật khẩu đã băm: đổi mật khẩu thì mọi phiên cũ tự hết hiệu lực */
const sign = (expires: string, admin: AdminAccount) =>
  createHmac("sha256", admin.passwordHash).update(`${admin.username}:${expires}`).digest("base64url");

export function createSessionToken(admin: AdminAccount) {
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires, admin)}`;
}

export async function isAdmin(request: NextRequest) {
  const [expires, signature] = request.cookies.get(SESSION_COOKIE)?.value.split(".") ?? [];
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  const admin = await getAdminAccount();
  return !!admin && safeEqual(Buffer.from(signature), Buffer.from(sign(expires, admin)));
}

/** Chỉ có một tài khoản nên đếm chung: sai 10 lần thì khóa đăng nhập 15 phút */
const MAX_FAILURES = 10;
const LOCK_MS = 15 * 60 * 1000;
const attempts = globalThis as unknown as { __weddingLogin?: { failures: number; resetAt: number } };

export function isLoginLocked() {
  const state = attempts.__weddingLogin;
  return !!state && state.failures >= MAX_FAILURES && Date.now() < state.resetAt;
}

export function recordLoginFailure() {
  const state = attempts.__weddingLogin;
  if (!state || Date.now() >= state.resetAt) {
    attempts.__weddingLogin = { failures: 1, resetAt: Date.now() + LOCK_MS };
  } else {
    state.failures += 1;
  }
}

export function clearLoginFailures() {
  attempts.__weddingLogin = undefined;
}
