import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { PORTFOLIO_MEDIA_DIR } from "@/lib/portfolio";

const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm" };

/**
 * Public portfolio media, for previews inside the team app. (On the website
 * nginx serves the same folder.) Portfolio files are public by nature.
 */
export async function GET(request, { params }) {
  const { name } = await params;
  const file = path.join(PORTFOLIO_MEDIA_DIR, path.basename(name));
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  let size;
  try { size = (await stat(file)).size; } catch { return new Response("Not found", { status: 404 }); }
  const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=604800", "X-Content-Type-Options": "nosniff" };
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || end < start) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(Readable.toWeb(createReadStream(file, { start, end })), { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(Readable.toWeb(createReadStream(file)), { headers: { ...headers, "Content-Length": String(size) } });
}
