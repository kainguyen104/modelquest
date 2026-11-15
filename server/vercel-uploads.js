const { randomUUID } = require("node:crypto");
const { ImportError, MAX_FILE_BYTES, MEDIA_TYPES, readBody } = require("./gemini-import");

function createBlobUploads(token = process.env.BLOB_READ_WRITE_TOKEN, sdk) {
  if (!token) return null;
  const { issueSignedToken, presignUrl, get, del } = sdk || require("@vercel/blob");
  return {
    async ticket(req, { signal }) {
      if (req.headers["content-type"]?.split(";")[0] !== "application/json") {
        throw new ImportError(415, "invalid_file");
      }
      const body = await readBody(req, 1024);
      let input;
      try { input = JSON.parse(body); }
      catch { throw new ImportError(400, "invalid_file"); }
      if (!MEDIA_TYPES.has(input?.mimeType) || !Number.isSafeInteger(input.size) || input.size < 1) {
        throw new ImportError(400, "invalid_file");
      }
      if (input.size > MAX_FILE_BYTES) throw new ImportError(413, "file_too_large");
      const pathname = "modelquest-uploads/" + randomUUID();
      const validUntil = Date.now() + 10 * 60 * 1000;
      const constraints = { pathname, validUntil, allowedContentTypes: [input.mimeType], maximumSizeInBytes: input.size };
      const signedToken = await issueSignedToken({
        ...constraints, token, operations: ["put"], abortSignal: AbortSignal.any([signal, AbortSignal.timeout(10000)])
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        ...constraints, access: "private", operation: "put", allowOverwrite: false, ttlDays: 1
      });
      return { pathname, uploadUrl: presignedUrl };
    },

    async read(pathname, signal) {
      if (typeof pathname !== "string" || !/^modelquest-uploads\/[0-9a-f-]{36}$/.test(pathname)) {
        throw new ImportError(400, "invalid_file");
      }
      const result = await get(pathname, {
        access: "private", token, useCache: false, abortSignal: AbortSignal.any([signal, AbortSignal.timeout(15000)])
      });
      if (!result?.stream) throw new ImportError(400, "invalid_file");
      try {
        const { size, contentType: mimeType } = result.blob;
        if (size > MAX_FILE_BYTES) throw new ImportError(413, "file_too_large");
        if (!size || !MEDIA_TYPES.has(mimeType)) throw new ImportError(400, "invalid_file");
        const data = Buffer.from(await new Response(result.stream).arrayBuffer());
        if (data.length !== size) throw new ImportError(400, "invalid_file");
        return { data, mimeType };
      } finally {
        if (!result.stream.locked) await result.stream.cancel().catch(() => {});
        // Fall back to the signed upload's expiry when immediate cleanup fails.
        await del(pathname, { token, abortSignal: AbortSignal.timeout(5000) }).catch(() => {});
      }
    }
  };
}

module.exports = { createBlobUploads };
