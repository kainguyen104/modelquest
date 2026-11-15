const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash, timingSafeEqual } = require("node:crypto");
const { importProblem, teacherAssistant, ImportError } = require("./server/gemini-import");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf"
};

const vendorAssets = new Set([
  "/node_modules/mammoth/mammoth.browser.min.js",
  "/node_modules/xlsx/dist/xlsx.full.min.js",
  "/node_modules/pdfjs-dist/build/pdf.min.mjs",
  "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs"
]);

const hash = value => createHash("sha256").update(value).digest();

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function createRequestHandler({
  apiKey = process.env.GEMINI_API_KEY?.trim(),
  model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash",
  teacherToken = process.env.MODELQUEST_AI_TOKEN?.trim(),
  production = process.env.NODE_ENV === "production",
  dailyLimit = Number(process.env.MODELQUEST_AI_DAILY_LIMIT || 100),
  uploads = null,
  directUploadLimit,
  fetchGemini = fetch
} = {}) {
  if (apiKey && (production || teacherToken) && !/^[A-Za-z0-9_+/-]{24,126}={0,2}$/.test(teacherToken || "")) {
    throw new Error("Set MODELQUEST_AI_TOKEN to a random base64 or base64url code of at least 24 characters.");
  }
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1) {
    throw new Error("MODELQUEST_AI_DAILY_LIMIT must be a positive integer.");
  }
  const tokenHash = teacherToken ? hash(teacherToken) : null;
  const limits = [{ max: 12, duration: 60000 }, { max: dailyLimit, duration: 86400000 }];
  let active = 0;
  return async (req, res, pathname = req.url?.split("?")[0]) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    if (pathname === "/healthz" && req.method === "GET") return sendJson(res, 200, { status: "ok" });
    const importer = pathname === "/api/import-problem";
    const uploadTicket = pathname === "/api/upload-ticket";
    if (importer || uploadTicket || pathname === "/api/teacher-ai") {
      const supplied = req.headers.authorization?.match(/^Bearer ([A-Za-z0-9_+/-]{24,126}={0,2})$/)?.[1];
      const authorized = !tokenHash || (!!supplied && timingSafeEqual(tokenHash, hash(supplied)));
      if (importer && req.method === "GET") {
        const status = { available: !!apiKey };
        if (apiKey && tokenHash) Object.assign(status, { requiresAccess: true, authorized });
        if (directUploadLimit) Object.assign(status, { directUploadLimit, largeUploads: !!uploads });
        return sendJson(res, 200, status);
      }
      if (req.method !== "POST") {
        res.setHeader("Allow", importer ? "GET, POST" : "POST");
        return sendJson(res, 405, { code: "method_not_allowed" });
      }
      const reject = (status, code) => { req.resume(); sendJson(res, status, { code }); };
      if (!apiKey) return reject(503, "unavailable");
      if (!authorized) return reject(401, "ai_access_required");
      if (uploadTicket && !uploads) return reject(503, "large_upload_unavailable");

      const now = Date.now();
      for (const limit of limits) {
        if (!limit.ends || now >= limit.ends) Object.assign(limit, { ends: now + limit.duration, used: 0 });
      }
      const exceeded = limits.find(limit => limit.used >= limit.max);
      if (exceeded || active >= 2) {
        res.setHeader("Retry-After", exceeded ? Math.ceil((exceeded.ends - now) / 1000) : 5);
        return reject(429, "rate_limited");
      }
      for (const limit of limits) limit.used++;
      active++;

      const ctl = new AbortController();
      res.once("close", () => { if (!res.writableEnded) ctl.abort(); });
      try {
        const handle = uploadTicket ? uploads.ticket : importer ? importProblem : teacherAssistant;
        const result = await handle(req, { apiKey, model, signal: ctl.signal, fetchGemini, uploads });
        if (!res.destroyed) sendJson(res, 200, result);
      } catch (error) {
        if (res.destroyed) return;
        req.resume();
        const known = error instanceof ImportError;
        sendJson(res, known ? error.status : 500, { code: known ? error.code : "unavailable" });
      } finally { active--; }
      return;
    }

    const publicPath = pathname === "/" ? "/index.html" : pathname;
    const mathAsset = /^\/node_modules\/katex\/dist\/(?:katex\.min\.(?:js|css)|fonts\/KaTeX_[\w-]+\.(?:woff2|woff|ttf))$/.test(publicPath || "");
    if (publicPath !== "/index.html" && !mathAsset && !vendorAssets.has(publicPath) && !/^\/(assets|images)\/[\w-]+\.(webp|svg|png)$/.test(publicPath || "")) {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    try {
      const file = await fs.readFile(path.join(__dirname, publicPath.slice(1)));
      res.writeHead(200, {
        "Content-Type": contentTypes[path.extname(publicPath)],
        "Content-Length": file.length,
        "Cache-Control": publicPath === "/index.html" ? "no-cache" : "public, max-age=3600"
      });
      res.end(req.method === "HEAD" ? undefined : file);
    } catch {
      res.writeHead(404).end();
    }
  };
}

function createServer(options) {
  return http.createServer(createRequestHandler(options));
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  const server = createServer().listen(port, host, () => console.log(`ModelQuest listening on ${host}:${port}`));
  process.once("SIGTERM", () => server.close());
}

module.exports = { createServer, createRequestHandler };
