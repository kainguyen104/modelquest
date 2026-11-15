const { createRequestHandler } = require("../server");
const { createBlobUploads } = require("../server/vercel-uploads");

const endpoints = new Map([
  ["import", "/api/import-problem"],
  ["assistant", "/api/teacher-ai"],
  ["upload", "/api/upload-ticket"],
  ["health", "/healthz"]
]);
const handle = createRequestHandler({
  production: true,
  directUploadLimit: 4 * 1024 * 1024,
  uploads: createBlobUploads()
});

module.exports = (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const route = endpoints.get(url.searchParams.get("mqroute")) ||
    [...endpoints.values()].find(endpoint => endpoint === url.pathname);
  if (!route) return res.writeHead(404).end();
  return handle(req, res, route);
};
