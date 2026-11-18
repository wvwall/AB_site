import { createHmac, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Authentication for /admin/lista-vini.
 *
 * 1. The browser signs in with Google and receives a signed ID token.
 * 2. `verifyGoogleIdToken` checks signature, audience, expiry and verified email.
 * 3. The email must be listed in ALLOWED_EMAILS.
 * 4. We then issue our own short-lived, HMAC-signed session cookie
 *    (HttpOnly, SameSite=Strict, Secure on https).
 *
 * Environment variables (Netlify -> scope "Functions"):
 *   GOOGLE_CLIENT_ID   OAuth client ID (public)
 *   ALLOWED_EMAILS     comma/space separated list of authorized Google emails
 *   SESSION_SECRET     random string, >= 32 chars (e.g. `openssl rand -base64 32`)
 */

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface AuthConfig {
  clientId: string;
  secret: string;
  allowed: string[];
}

export const parseAllowedEmails = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

/** Returns null when the deployment is not (fully) configured. */
export function readAuthConfig(
  env: Record<string, string | undefined> = process.env,
): AuthConfig | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const secret = env.SESSION_SECRET?.trim();
  const allowed = parseAllowedEmails(env.ALLOWED_EMAILS);
  if (!clientId || !secret || secret.length < 32 || allowed.length === 0) {
    return null;
  }
  return { clientId, secret, allowed };
}

export const isAllowed = (cfg: AuthConfig, email: string) =>
  cfg.allowed.includes(email.trim().toLowerCase());

export class AuthError extends Error {
  code: "invalid_token" | "forbidden";
  constructor(code: "invalid_token" | "forbidden") {
    super(code);
    this.code = code;
  }
}

/**
 * Validates a Google ID token and returns the (lower-cased) email, or throws
 * AuthError. `keys` is injectable for tests; production uses Google's JWKS.
 */
export async function verifyGoogleIdToken(
  token: string,
  cfg: AuthConfig,
  keys: JWTVerifyGetKey = GOOGLE_JWKS,
): Promise<string> {
  let email: unknown;
  let verified: unknown;
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: GOOGLE_ISSUERS,
      audience: cfg.clientId,
      algorithms: ["RS256"],
    });
    email = payload.email;
    verified = payload.email_verified;
  } catch {
    throw new AuthError("invalid_token");
  }
  if (typeof email !== "string" || verified !== true) {
    throw new AuthError("invalid_token");
  }
  if (!isAllowed(cfg, email)) throw new AuthError("forbidden");
  return email.toLowerCase();
}

// ── Session cookie ──────────────────────────────────────────────

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const sign = (data: string, secret: string) =>
  createHmac("sha256", secret).update(data).digest();

export function createSession(
  email: string,
  secret: string,
  now = Date.now(),
): string {
  const body = b64url(
    JSON.stringify({ e: email, x: Math.floor(now / 1000) + SESSION_TTL_SECONDS }),
  );
  return `${body}.${b64url(sign(body, secret))}`;
}

/** Returns the session's email if the cookie is genuine and not expired. */
export function readSession(
  cookieHeader: string | null,
  secret: string,
  now = Date.now(),
  secure = true,
): string | null {
  const value = parseCookies(cookieHeader)[cookieName(secure)];
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;

  const expected = sign(body, secret);
  let given: Buffer;
  try {
    given = Buffer.from(mac, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const { e, x } = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof e !== "string" || typeof x !== "number") return null;
    return x * 1000 > now ? e : null;
  } catch {
    return null;
  }
}

/** `__Host-` prefix pins the cookie to this exact host over https. Plain http (local dev) can't use it. */
export const cookieName = (secure: boolean) =>
  secure ? "__Host-ab_admin" : "ab_admin";

export const isSecureRequest = (req: Request) =>
  new URL(req.url).protocol === "https:";

export function sessionCookie(value: string, secure: boolean, maxAge = SESSION_TTL_SECONDS) {
  return [
    `${cookieName(secure)}=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export const clearCookie = (secure: boolean) => sessionCookie("", secure, 0);

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

/** State-changing requests must come from our own origin (defence in depth on top of SameSite). */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  return !!origin && origin === new URL(req.url).origin;
}
