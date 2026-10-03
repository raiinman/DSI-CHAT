import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Script } from "node:vm";
const root = new URL("../", import.meta.url);
const out = new URL("dist/chromium/", root);
await mkdir(out, { recursive: true });
async function bundle(entry, destination) {
    await build({ entryPoints: [fileURLToPath(new URL(entry, root))], outfile: fileURLToPath(new URL(destination, out)), bundle: true,
        format: "iife", platform: "browser", target: "es2022", sourcemap: "external" });
    new Script(await readFile(new URL(destination, out), "utf8"), { filename: destination });
}
await bundle("src/plugins/browser-entry.mjs", "content.js");
await bundle("src/plugins/popup-entry.mjs", "popup.js");
for (const file of ["manifest.json", "popup.html", "popup.css"]) await copyFile(new URL("browser/" + file, root), new URL(file, out));
const names = ["content.js", "content.js.map", "popup.js", "popup.js.map", "manifest.json", "popup.html", "popup.css"];
const sums = await Promise.all(names.map(async file => createHash("sha256").update(await readFile(new URL(file, out))).digest("hex") + "  " + file));
await writeFile(new URL("SHA256SUMS", out), sums.join("\n") + "\n");
console.log("Built dependency-free extension: dist/chromium");
await import("./build-plugins.mjs");
