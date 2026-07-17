// Stateless admin session auth. A signed token proves the client knew the
// ADMIN_PASSWORD; the signature is an HMAC keyed by a hash of the password, so
// forging a token requires the password and rotating the password invalidates
// every outstanding session. No server-side session store, no dependencies.
import { createHash, createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "nmc_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const VERSION = "v1";

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

function sha256(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

function signingKey(pw: string): Buffer {
  // Derive a key from the password rather than using it directly as HMAC key.
  return sha256("nmc-admin-v1:" + pw);
}

/** Constant-time compare of two strings via fixed-length digests. */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function verifyPassword(input: unknown): boolean {
  const pw = adminPassword();
  if (!pw || typeof input !== "string") return false;
  return safeEqual(input, pw);
}

export function mintToken(): string {
  const pw = adminPassword();
  if (!pw) throw new Error("ADMIN_PASSWORD is not set");
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${VERSION}.${expiresAt}`;
  const sig = createHmac("sha256", signingKey(pw)).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined | null): boolean {
  const pw = adminPassword();
  if (!pw || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresAtStr, sig] = parts;
  if (version !== VERSION) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const expected = createHmac("sha256", signingKey(pw))
    .update(`${version}.${expiresAtStr}`)
    .digest("hex");
  return safeEqual(sig, expected);
}

/** Works for both API route requests and getServerSideProps `req` (both carry `.cookies`). */
export function isAdminRequest(req: {
  cookies?: Partial<Record<string, string>>;
}): boolean {
  return verifyToken(req.cookies?.[COOKIE_NAME]);
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}
