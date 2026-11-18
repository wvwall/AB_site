import { createHash } from "node:crypto";
import type { Config, Context } from "@netlify/functions";
import {
  AuthError,
  clearCookie,
  createSession,
  isAllowed,
  isSameOrigin,
  isSecureRequest,
  readAuthConfig,
  readSession,
  sessionCookie,
  verifyGoogleIdToken,
  type AuthConfig,
} from "./_shared/auth.mts";
import {
  CURRENT_KEY,
  MAX_UPLOAD_BYTES,
  PREVIOUS_KEY,
  json,
  wineListStore,
  type WineListMeta,
} from "./_shared/wine-list-store.mts";

/**
 * Private API behind /admin/lista-vini. Auth: Google sign-in + ALLOWED_EMAILS
 * (see _shared/auth.mts).
 *
 *   GET  /api/wine-list/config   public: { clientId } for the Google button
 *   POST /api/wine-list/login    { credential } Google ID token -> session cookie
 *   POST /api/wine-list/logout   clears the session cookie
 *   GET  /api/wine-list          session: metadata of current + previous version
 *   PUT  /api/wine-list          session: upload a new PDF (raw body)
 *   POST /api/wine-list/restore  session: swap current and previous (undo)
 */

const sha256Hex = (value: Uint8Array) =>
  createHash("sha256").update(value).digest("hex");

const readMeta = async (key: string) => {
  const found = await wineListStore().getMetadata(key);
  return found ? (found.metadata as unknown as WineListMeta) : null;
};

async function handleStatus(email: string) {
  const [current, previous] = await Promise.all([
    readMeta(CURRENT_KEY),
    readMeta(PREVIOUS_KEY),
  ]);
  return json({ current, previous, maxBytes: MAX_UPLOAD_BYTES, email });
}

async function handleUpload(req: Request, email: string) {
  // Anything other than application/pdf may be decoded as text by the
  // platform and silently corrupt the binary, so refuse it up front.
  if (!(req.headers.get("content-type") ?? "").startsWith("application/pdf")) {
    return json({ error: "not_pdf" }, 415);
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) {
    return json({ error: "too_large", maxBytes: MAX_UPLOAD_BYTES }, 413);
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0) return json({ error: "empty" }, 400);
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return json({ error: "too_large", maxBytes: MAX_UPLOAD_BYTES }, 413);
  }
  // Check the magic number rather than trusting the declared content type.
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    return json({ error: "not_pdf" }, 415);
  }

  let originalName = "WineList.pdf";
  try {
    originalName =
      decodeURIComponent(req.headers.get("x-file-name") ?? "").slice(0, 200) ||
      originalName;
  } catch {
    /* keep default */
  }

  const meta: WineListMeta = {
    originalName,
    size: bytes.byteLength,
    uploadedAt: new Date().toISOString(),
    uploadedBy: email,
    etag: sha256Hex(bytes).slice(0, 32),
  };

  const store = wineListStore();
  const existing = await store.getWithMetadata(CURRENT_KEY, {
    type: "arrayBuffer",
  });
  if (existing) {
    await store.set(PREVIOUS_KEY, existing.data, {
      metadata: existing.metadata,
    });
  }
  await store.set(CURRENT_KEY, bytes.buffer as ArrayBuffer, {
    metadata: { ...meta },
  });

  return json({ current: meta, previous: existing?.metadata ?? null }, 201);
}

async function handleRestore() {
  const store = wineListStore();
  const [current, previous] = await Promise.all([
    store.getWithMetadata(CURRENT_KEY, { type: "arrayBuffer" }),
    store.getWithMetadata(PREVIOUS_KEY, { type: "arrayBuffer" }),
  ]);
  if (!previous) return json({ error: "no_previous" }, 409);

  await store.set(CURRENT_KEY, previous.data, { metadata: previous.metadata });
  if (current) {
    await store.set(PREVIOUS_KEY, current.data, { metadata: current.metadata });
  } else {
    await store.delete(PREVIOUS_KEY);
  }

  return json({
    current: previous.metadata,
    previous: current?.metadata ?? null,
  });
}

async function handleLogin(req: Request, cfg: AuthConfig, secure: boolean) {
  let credential: unknown;
  try {
    credential = (await req.json())?.credential;
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (typeof credential !== "string" || credential.length > 4096) {
    return json({ error: "bad_request" }, 400);
  }

  try {
    const email = await verifyGoogleIdToken(credential, cfg);
    const res = json({ email });
    res.headers.append(
      "set-cookie",
      sessionCookie(createSession(email, cfg.secret), secure),
    );
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return json({ error: err.code }, err.code === "forbidden" ? 403 : 401);
    }
    throw err;
  }
}

export default async (req: Request, _context: Context) => {
  const { pathname } = new URL(req.url);
  const route = pathname.replace(/\/+$/, "");
  const secure = isSecureRequest(req);

  const cfg = readAuthConfig();
  if (!cfg) return json({ error: "unconfigured" }, 503);

  try {
    // Public: the page needs the client ID to render the Google button.
    if (route === "/api/wine-list/config" && req.method === "GET") {
      return json({ clientId: cfg.clientId });
    }

    // Everything except reading the config is same-origin only when it mutates state.
    if (req.method !== "GET" && !isSameOrigin(req)) {
      return json({ error: "forbidden_origin" }, 403);
    }

    if (route === "/api/wine-list/login" && req.method === "POST") {
      return await handleLogin(req, cfg, secure);
    }

    if (route === "/api/wine-list/logout" && req.method === "POST") {
      const res = json({ ok: true });
      res.headers.append("set-cookie", clearCookie(secure));
      return res;
    }

    // Authenticated routes. The allow-list is re-checked on every request,
    // so removing an email (and redeploying) revokes open sessions at once.
    const email = readSession(
      req.headers.get("cookie"),
      cfg.secret,
      Date.now(),
      secure,
    );
    if (!email || !isAllowed(cfg, email)) {
      return json({ error: "unauthorized" }, 401);
    }

    if (route === "/api/wine-list/restore" && req.method === "POST") {
      return await handleRestore();
    }
    if (route === "/api/wine-list" && req.method === "GET") {
      return await handleStatus(email);
    }
    if (route === "/api/wine-list" && req.method === "PUT") {
      return await handleUpload(req, email);
    }
  } catch (err) {
    console.error("wine-list-admin error", err);
    return json({ error: "server_error" }, 500);
  }

  return json({ error: "method_not_allowed" }, 405);
};

export const config: Config = {
  path: [
    "/api/wine-list",
    "/api/wine-list/config",
    "/api/wine-list/login",
    "/api/wine-list/logout",
    "/api/wine-list/restore",
  ],
  // Safety net on top of Google sign-in: at most 60 requests/minute per IP.
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
};
