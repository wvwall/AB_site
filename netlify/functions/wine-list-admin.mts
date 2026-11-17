import { createHash, timingSafeEqual } from "node:crypto";
import type { Config, Context } from "@netlify/functions";
import {
  CURRENT_KEY,
  MAX_UPLOAD_BYTES,
  PREVIOUS_KEY,
  json,
  wineListStore,
  type WineListMeta,
} from "./_shared/wine-list-store.mts";

/**
 * Private API behind /admin/lista-vini.
 *
 *   GET  /api/wine-list          -> metadata of current + previous version
 *   PUT  /api/wine-list          -> upload a new PDF (raw body, application/pdf)
 *   POST /api/wine-list/restore  -> swap current and previous version (undo)
 *
 * Every call requires `Authorization: Bearer <WINE_LIST_ADMIN_PASSWORD>`.
 */

const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function isAuthorized(req: Request): Promise<boolean | "unconfigured"> {
  const expected = process.env.WINE_LIST_ADMIN_PASSWORD;
  if (!expected) return "unconfigured";

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Hash both sides so lengths always match and the comparison is constant-time.
  const ok = timingSafeEqual(sha256(provided), sha256(expected));
  if (!ok) await sleep(800); // slow down brute-force attempts
  return ok;
}

const readMeta = async (key: string) => {
  const found = await wineListStore().getMetadata(key);
  return found ? (found.metadata as unknown as WineListMeta) : null;
};

async function handleStatus() {
  const [current, previous] = await Promise.all([
    readMeta(CURRENT_KEY),
    readMeta(PREVIOUS_KEY),
  ]);
  return json({ current, previous, maxBytes: MAX_UPLOAD_BYTES });
}

async function handleUpload(req: Request) {
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
    etag: sha256(bytes).toString("hex").slice(0, 32),
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

export default async (req: Request, _context: Context) => {
  const auth = await isAuthorized(req);
  if (auth === "unconfigured") return json({ error: "unconfigured" }, 503);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const { pathname } = new URL(req.url);
  const isRestore = pathname.endsWith("/restore");

  try {
    if (isRestore && req.method === "POST") return await handleRestore();
    if (!isRestore && req.method === "GET") return await handleStatus();
    if (!isRestore && req.method === "PUT") return await handleUpload(req);
  } catch (err) {
    console.error("wine-list-admin error", err);
    return json({ error: "server_error" }, 500);
  }

  return json({ error: "method_not_allowed" }, 405);
};

export const config: Config = {
  path: ["/api/wine-list", "/api/wine-list/restore"],
};
