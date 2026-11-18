import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

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
  /** Google email of whoever uploaded it. */
  uploadedBy?: string;
  etag: string;
}

/**
 * `getStore()` is site-wide: production, deploy previews and branch deploys
 * would all read and write the SAME data, so uploading a test PDF from a
 * deploy preview would overwrite the live wine list. Only the production
 * deploy uses the "wine-list" store; every other context (deploy-preview,
 * branch-deploy, dev, or anything we can't identify) gets its own store.
 */
export const storeNameFor = (deployContext: string | undefined) =>
  deployContext === "production"
    ? "wine-list"
    : `wine-list-${deployContext || "unknown"}`;

export const wineListStore = (context: Context) =>
  getStore({
    name: storeNameFor(context?.deploy?.context),
    consistency: "strong",
  });

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
