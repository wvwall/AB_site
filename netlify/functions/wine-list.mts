import type { Config, Context } from "@netlify/functions";
import {
  CURRENT_KEY,
  wineListStore,
  type WineListMeta,
} from "./_shared/wine-list-store.mts";

/**
 * Public, stable download URL for the wine list: /lista-vini.pdf
 *
 * Serves the latest PDF uploaded from /admin/lista-vini. If nothing has been
 * uploaded yet, falls back to the static public/WineList.pdf so the button on
 * the site never breaks.
 */
const DOWNLOAD_NAME = "WineList.pdf";
const STATIC_FALLBACK = "/WineList.pdf";

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const store = wineListStore();
  const found = await store.getMetadata(CURRENT_KEY);

  if (!found) {
    return Response.redirect(new URL(STATIC_FALLBACK, req.url), 302);
  }

  const meta = found.metadata as unknown as WineListMeta;
  const etag = `"${meta.etag}"`;
  const headers = new Headers({
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="${DOWNLOAD_NAME}"`,
    // Always revalidate: a new upload must be visible immediately.
    "cache-control": "public, max-age=0, must-revalidate",
    etag,
    "last-modified": new Date(meta.uploadedAt).toUTCString(),
    "x-robots-tag": "noindex",
  });

  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  if (req.method === "HEAD") {
    headers.set("content-length", String(meta.size));
    return new Response(null, { status: 200, headers });
  }

  const file = await store.get(CURRENT_KEY, { type: "arrayBuffer" });
  if (!file) {
    return Response.redirect(new URL(STATIC_FALLBACK, req.url), 302);
  }

  headers.set("content-length", String(file.byteLength));
  return new Response(file, { status: 200, headers });
};

export const config: Config = {
  path: "/lista-vini.pdf",
};
