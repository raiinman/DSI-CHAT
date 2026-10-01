import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const checksums = JSON.parse(await readFile(path.join(root, "release/checksums.json"), "utf8"));
if (!checksums.length) throw new Error("No packaged artifacts to verify.");
for (const entry of checksums) {
    const file = path.join(root, "release", entry.file);
    const bytes = await readFile(file);
    if (bytes.length !== entry.bytes || createHash("sha256").update(bytes).digest("hex") !== entry.sha256) {
        throw new Error(`Artifact checksum failed: ${entry.file}`);
    }
}
const manifestPath = path.join(root, "release/web/chromium-unpacked/manifest.json");
try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.name !== "DSI CHAT Web") throw new Error("Wrong browser extension identity.");
    const referenced = [...manifest.content_scripts.flatMap(script => script.js), manifest.background.service_worker];
    for (const file of referenced) await stat(path.join(path.dirname(manifestPath), file));
} catch (error) {
    if (error.code !== "ENOENT" || checksums.some(entry => entry.file.startsWith("web/"))) throw error;
}
console.log(`Verified ${checksums.length} artifact checksums and available browser entrypoints.`);
