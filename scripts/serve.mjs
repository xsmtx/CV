import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";

// Local production preview of the static export; deploy out/ to a static host.
const root = path.resolve("out");
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};
const cache = new Map();
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const requested = path.resolve(
      root,
      `.${decodeURIComponent(url.pathname)}`,
    );
    if (requested !== root && !requested.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    let file = requested;
    let status = 200;
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = path.join(file, "index.html");
    } catch {
      file = path.join(root, "404.html");
      status = 404;
    }
    const mime = types[path.extname(file)] || "application/octet-stream";
    const encoding = req.headers["accept-encoding"] || "";
    const compression = /text|javascript|json|xml|svg/.test(mime)
      ? encoding.includes("br")
        ? "br"
        : encoding.includes("gzip")
          ? "gzip"
          : ""
      : "";
    const version = (await stat(file)).mtimeMs;
    const key = `${file}:${version}:${compression}`;
    let bytes = cache.get(key);
    if (!bytes) {
      const raw = await readFile(file);
      bytes =
        compression === "br"
          ? brotliCompressSync(raw)
          : compression === "gzip"
            ? gzipSync(raw)
            : raw;
      cache.set(key, bytes);
    }
    res.writeHead(status, {
      "Content-Type": mime,
      "Content-Length": bytes.length,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": url.pathname.startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      ...(compression
        ? { "Content-Encoding": compression, Vary: "Accept-Encoding" }
        : {}),
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res
      .writeHead(500)
      .end(
        "Build the static site with npm run build before starting the preview.",
      );
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`Production preview: http://localhost:${port}`),
);
