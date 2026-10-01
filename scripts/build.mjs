import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Script } from "node:vm";
const root = new URL("../", import.meta.url);
const out = new URL("dist/chromium/", root);
await mkdir(out, { recursive: true });
async function bundle(parts, destination) {
    const sources = await Promise.all(parts.map(path => readFile(new URL(path, root), "utf8")));
    const code = '"use strict";\n(() => {\n' + sources.join("\n").replace(/^import .*;\n/gm, "").replace(/^export /gm, "") + "\n})();\n";
    new Script(code, { filename: destination });
    await writeFile(new URL(destination, out), code);
}
await bundle(["src/core.mjs", "src/features.mjs", "src/content.mjs"], "content.js");
await bundle(["src/core.mjs", "src/popup.mjs"], "popup.js");
for (const file of ["manifest.json", "popup.html", "popup.css"]) await copyFile(new URL("browser/" + file, root), new URL(file, out));
const names = ["content.js", "popup.js", "manifest.json", "popup.html", "popup.css"];
const sums = await Promise.all(names.map(async file => createHash("sha256").update(await readFile(new URL(file, out))).digest("hex") + "  " + file));
await writeFile(new URL("SHA256SUMS", out), sums.join("\n") + "\n");
console.log("Built dependency-free extension: dist/chromium");
