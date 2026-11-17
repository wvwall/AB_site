import { getStore } from "@netlify/blobs";

/** Blob keys: the live wine list and the one it replaced (for undo). */
export const CURRENT_KEY = "current";
export const PREVIOUS_KEY = "previous";

/** Raw request bodies on Netlify Functions are capped at ~6 MB (base64 overhead included). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export interface WineListMeta {
  /** Original filename chosen by whoever uploaded it, for display only. */
  originalName: string;
  size: number;
  uploadedAt: string;
  etag: string;
}

export const wineListStore = () =>
  getStore({ name: "wine-list", consistency: "strong" });

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
