import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PB_URL = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";
const PORT = Number(process.env.PORT || 3000);

const app = express();

const publicDir = path.join(__dirname, "..", "public");

async function pbFetch(pathname, options = {}) {
  const res = await fetch(`${PB_URL}${pathname}`, options);
  return res;
}

async function findSubsiteBySlug(slug) {
  const filter = encodeURIComponent(`slug="${slug.replace(/"/g, '\\"')}"`);
  const res = await pbFetch(
    `/api/collections/subsites/records?filter=${filter}&perPage=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0] ?? null;
}

async function findSiteFile(subsiteId, filePath) {
  const filter = encodeURIComponent(
    `subsite="${subsiteId}" && path="${filePath.replace(/"/g, '\\"')}"`
  );
  const res = await pbFetch(
    `/api/collections/site_files/records?filter=${filter}&perPage=1`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0] ?? null;
}

function pocketbaseFileUrl(collection, recordId, filename) {
  return `${PB_URL}/api/files/${collection}/${recordId}/${filename}`;
}

function contentTypeForPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".htm": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".wasm": "application/wasm",
  };
  return map[ext] || "application/octet-stream";
}

function injectBaseHref(html, baseHref) {
  const baseTag = `<base href="${baseHref}">`;
  if (/<base\s/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }
  return `<!DOCTYPE html><html><head>${baseTag}</head><body>${html}</body></html>`;
}

const INDEX_CANDIDATES = ["index.html", "index.htm", "Index.html"];

async function resolveIndexPath(subsiteId) {
  for (const candidate of INDEX_CANDIDATES) {
    const record = await findSiteFile(subsiteId, candidate);
    if (record) return candidate;
  }
  return null;
}

app.get("/api/health", async (_req, res) => {
  try {
    const r = await pbFetch("/api/health");
    res.status(r.ok ? 200 : 503).json({
      portal: "ok",
      pocketbase: r.ok ? "ok" : "error",
    });
  } catch {
    res.status(503).json({ portal: "ok", pocketbase: "unreachable" });
  }
});

app.use(
  createProxyMiddleware({
    target: PB_URL,
    changeOrigin: true,
    pathFilter: (pathname) =>
      pathname.startsWith("/api/") && pathname !== "/api/health",
  })
);

app.use(express.static(publicDir));

app.use("/s", async (req, res, next) => {
  const parts = req.path.split("/").filter(Boolean);
  if (parts.length === 0) {
    next();
    return;
  }

  const slug = parts[0];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    res.status(400).send("Ongeldige slug.");
    return;
  }

  if (parts.length === 1 && !req.path.endsWith("/")) {
    res.redirect(301, `/s/${slug}/`);
    return;
  }

  const subsite = await findSubsiteBySlug(slug);
  if (!subsite) {
    res.status(404).send("Subsite niet gevonden.");
    return;
  }

  const normalized = parts.slice(1).join("/");
  if (!normalized) {
    const indexPath = await resolveIndexPath(subsite.id);
    if (!indexPath) {
      res.status(404).send("Geen index.html gevonden in deze subsite.");
      return;
    }
    const record = await findSiteFile(subsite.id, indexPath);
    const fileUrl = pocketbaseFileUrl("site_files", record.id, record.file);
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      res.status(502).send("Bestand kon niet worden geladen.");
      return;
    }
    const html = await fileRes.text();
    res.type("html").send(injectBaseHref(html, `/s/${slug}/`));
    return;
  }

  if (normalized.includes("..")) {
    res.status(400).send("Ongeldig pad.");
    return;
  }

  const record = await findSiteFile(subsite.id, normalized);
  if (!record) {
    res.status(404).send("Bestand niet gevonden.");
    return;
  }

  const fileUrl = pocketbaseFileUrl("site_files", record.id, record.file);
  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    res.status(502).send("Bestand kon niet worden geladen.");
    return;
  }

  res.setHeader("Content-Type", contentTypeForPath(normalized));
  const buf = Buffer.from(await fileRes.arrayBuffer());
  res.send(buf);
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Subsite-portal op http://0.0.0.0:${PORT} (PocketBase: ${PB_URL})`);
});
