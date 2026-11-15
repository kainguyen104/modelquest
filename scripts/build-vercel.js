const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const vendors = [
  ["katex/dist/katex.min.js", "katex/katex.min.js"],
  ["katex/dist/katex.min.css", "katex/katex.min.css"],
  ["katex/dist/fonts", "katex/fonts"],
  ["mammoth/mammoth.browser.min.js", "mammoth/mammoth.browser.min.js"],
  ["xlsx/dist/xlsx.full.min.js", "xlsx/xlsx.full.min.js"],
  ["pdfjs-dist/build/pdf.min.mjs", "pdfjs/pdf.min.mjs"],
  ["pdfjs-dist/build/pdf.worker.min.mjs", "pdfjs/pdf.worker.min.mjs"]
];

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const [source, target] of vendors) {
  const dest = path.join(output, "vendor", target);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(path.join(root, "node_modules", source), dest, { recursive: true });
  html = html.replaceAll("node_modules/" + source, "vendor/" + target);
}
for (const folder of ["assets", "images"]) {
  fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
}
fs.writeFileSync(path.join(output, "index.html"), html);
