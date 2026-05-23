import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const cookieName = "admin_session";

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL ?? "dzungrock@gmail.com";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.VOTE_IP_SALT ?? "local-admin-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function createToken(email: string) {
  const issuedAt = Date.now();
  const payload = `${email}:${issuedAt}`;
  return `${payload}:${sign(payload)}`;
}

function verifyToken(token: string | undefined) {
  if (!token) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [email, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (email !== getAdminEmail() || !Number.isFinite(issuedAt)) return false;

  const maxAgeMs = 1000 * 60 * 60 * 24 * 7;
  if (Date.now() - issuedAt > maxAgeMs) return false;

  const expected = sign(`${email}:${issuedAtRaw}`);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function validateAdminLogin(email: string, password: string) {
  return email.trim().toLowerCase() === getAdminEmail().toLowerCase() && password === getAdminPassword();
}

export function setAdminSession(response: NextResponse, email: string) {
  response.cookies.set(cookieName, createToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(cookieName)?.value);
}

export function isAdminRequest(request: NextRequest) {
  return verifyToken(request.cookies.get(cookieName)?.value);
}

export function unauthorizedAdminResponse() {
  return NextResponse.json({ error: "Bạn cần đăng nhập admin" }, { status: 401 });
}
