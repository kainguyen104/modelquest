const assert = require("node:assert/strict");
const { once } = require("node:events");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");
const { createServer } = require("../server");
const { createBlobUploads } = require("../server/vercel-uploads");

async function serve(t, options) {
  const server = createServer(options).listen(0, "127.0.0.1");
  t.after(() => server.close());
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

const draft = { title: "Cooling drink", brief: "Find out when a hot drink will cool enough to sip.", story: "The drink cools over time.", vars: [
  { kind: "in", key: "t" }, { kind: "out", key: "T", formula: "20 + 60 * exp(-t / 5)" }
] };

test("server imports extracted text and sends PDFs directly to Gemini", async t => {
  const calls = [];
  const origin = await serve(t, {
    apiKey: "server-only-key",
    model: "gemini-test-flash",
    fetchGemini: async (url, options) => {
      calls.push({ url, headers: options.headers, ...JSON.parse(options.body) });
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(draft) }] } }] });
    }
  });
  const endpoint = origin + "/api/import-problem";
  assert.deepEqual(await (await fetch(endpoint)).json(), { available: true });
  const page = await (await fetch(origin)).text();
  assert.ok(page.includes("ModelQuest"));
  assert.ok(!page.includes("server-only-key"));
  assert.equal((await fetch(origin + "/server/gemini-import.js")).status, 404);

  const text = "At t = 0 the drink is 80°C.";
  const textResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "cooling.txt", text })
  });
  assert.equal(textResponse.status, 200);
  assert.deepEqual(await textResponse.json(), draft);
  assert.match(calls[0].url, /\/gemini-test-flash:generateContent$/);
  assert.equal(calls[0].headers["x-goog-api-key"], "server-only-key");
  assert.equal(calls[0].generationConfig.responseMimeType, "application/json");
  assert.equal(calls[0].generationConfig.responseJsonSchema.properties.cases.items.properties.inputs.type, "array");
  assert.deepEqual(calls[0].contents[0].parts[1], { text });

  const pdf = await readFile(path.join(__dirname, "fx", "cooling.pdf"));
  const pdfResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/pdf", "X-File-Name": encodeURIComponent("làm nguội.pdf") },
    body: pdf
  });
  assert.equal(pdfResponse.status, 200);
  assert.deepEqual(await pdfResponse.json(), draft);
  assert.match(calls[1].contents[0].parts[0].text, /làm nguội\.pdf/);
  assert.deepEqual(calls[1].contents[0].parts[1].inlineData, {
    mimeType: "application/pdf", data: pdf.toString("base64")
  });
});

test("server handles missing configuration, invalid uploads, rate limits and invalid drafts", async t => {
  const offline = await serve(t, { apiKey: "" }) + "/api/import-problem";
  assert.deepEqual(await (await fetch(offline)).json(), { available: false });
  assert.equal((await fetch(offline, { method: "POST" })).status, 503);

  let calls = 0;
  const endpoint = await serve(t, {
    apiKey: "test-key",
    fetchGemini: async () => ++calls === 1
      ? Response.json({ error: "quota" }, { status: 429 })
      : Response.json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] })
  }) + "/api/import-problem";
  const upload = body => fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" }, body
  });
  assert.equal((await upload("{}")).status, 400);
  assert.equal((await upload("x".repeat(250000))).status, 413);
  const valid = JSON.stringify({ name: "worksheet.txt", text: "Draft this problem." });
  const limited = await upload(valid);
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { code: "rate_limited" });
  const malformed = await upload(valid);
  assert.equal(malformed.status, 502);
  assert.deepEqual(await malformed.json(), { code: "invalid_json" });
});

test("production serves public lessons and protects both AI endpoints with a shared quota", async t => {
  assert.throws(() => createServer({ apiKey: "test-key", production: true, teacherToken: "" }), /MODELQUEST_AI_TOKEN/);
  const teacherToken = "test-access-code-with-32-characters";
  const ideas = [{ title: "Cooling drink", hook: "How fast does tea cool?", model: "Temperature over time" }];
  const calls = [];
  const origin = await serve(t, {
    apiKey: "test-key",
    teacherToken,
    production: true,
    dailyLimit: 2,
    fetchGemini: async (_, options) => {
      const body = JSON.parse(options.body);
      calls.push(body);
      const response = body.generationConfig.responseJsonSchema.type === "array" ? ideas : draft;
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(response) }] } }] });
    }
  });
  const importUrl = origin + "/api/import-problem";
  const assistantUrl = origin + "/api/teacher-ai";
  const headers = { "Content-Type": "application/json" };
  const authorized = { ...headers, Authorization: "Bearer " + teacherToken };
  const upload = JSON.stringify({ name: "cooling.txt", text: "At t = 0 the drink is 80°C." });
  const prompt = JSON.stringify({ action: "ideas", prompt: "Suggest a problem about cooling." });
  assert.equal((await fetch(origin)).status, 200);
  assert.equal((await fetch(origin + "/.env")).status, 404);
  assert.deepEqual(await (await fetch(origin + "/healthz")).json(), { status: "ok" });
  assert.deepEqual(await (await fetch(importUrl)).json(), { available: true, requiresAccess: true, authorized: false });
  assert.deepEqual(await (await fetch(importUrl, { headers: authorized })).json(),
    { available: true, requiresAccess: true, authorized: true });
  assert.equal((await fetch(assistantUrl, { method: "POST", headers, body: prompt })).status, 401);
  assert.equal((await fetch(importUrl, { method: "POST", headers, body: upload })).status, 401);
  assert.equal(calls.length, 0);
  assert.deepEqual(await (await fetch(assistantUrl, { method: "POST", headers: authorized, body: prompt })).json(), ideas);
  assert.deepEqual(await (await fetch(importUrl, { method: "POST", headers: authorized, body: upload })).json(), draft);
  const limited = await fetch(importUrl, { method: "POST", headers: authorized, body: upload });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("Retry-After")) > 0);
  assert.equal(calls.length, 2);
});

test("large uploads use a private scoped ticket and are deleted once read for Gemini", async t => {
  const teacherToken = "test-access-code-with-32-characters";
  const fixture = Buffer.from("%PDF-test");
  let issued;
  let deleted;
  let received;
  const uploads = createBlobUploads("mock-storage-token", {
    async issueSignedToken(settings) { issued = settings; return {}; },
    async presignUrl(_, settings) {
      assert.equal(settings.access, "private");
      assert.equal(settings.allowOverwrite, false);
      return { presignedUrl: "https://example.test/short-lived" };
    },
    async get(pathname) {
      assert.equal(pathname, issued.pathname);
      return { stream: new Response(fixture).body, blob: { size: fixture.length, contentType: "application/pdf" } };
    },
    async del(pathname) { deleted = pathname; }
  });
  const origin = await serve(t, {
    apiKey: "mock-key", teacherToken, production: true, directUploadLimit: 4 * 1024 * 1024, uploads,
    fetchGemini: async (_, options) => {
      received = JSON.parse(options.body).contents[0].parts[1].inlineData;
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(draft) }] } }] });
    }
  });
  const post = (route, body, auth = true) => fetch(origin + route, {
    method: "POST", body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + teacherToken } : {}) }
  });
  const metadata = { mimeType: "application/pdf", size: 5 * 1024 * 1024 };
  assert.equal((await post("/api/upload-ticket", metadata, false)).status, 401);
  assert.equal(issued, undefined);
  const ticket = await (await post("/api/upload-ticket", metadata)).json();
  assert.match(ticket.pathname, /^modelquest-uploads\/[0-9a-f-]{36}$/);
  assert.equal(issued.maximumSizeInBytes, metadata.size);
  assert.deepEqual(issued.allowedContentTypes, ["application/pdf"]);
  assert.equal((await post("/api/import-problem", { name: "problem.pdf", blobPath: "https://example.test/other" })).status, 400);
  assert.deepEqual(await (await post("/api/import-problem", { name: "problem.pdf", blobPath: ticket.pathname })).json(), draft);
  assert.deepEqual(received, { mimeType: "application/pdf", data: fixture.toString("base64") });
  assert.equal(deleted, ticket.pathname);
});
