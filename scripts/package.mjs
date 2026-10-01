import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const task = process.argv[2];
const targets = task === "build" ? ["mobile", "desktop", "web"] : [task];
const release = path.join(root, "release");
await mkdir(release, { recursive: true });
for (const target of targets) {
    const dir = path.join(release, target);
    await mkdir(dir, { recursive: true });
    if (target === "mobile") {
        for (const name of ["dsi-chat.js", "dsi-chat.min.js"]) await cp(path.join(root, "apps/mobile/dist", name), path.join(dir, name));
        await cp(path.join(root, "apps/mobile/LICENSE"), path.join(dir, "LICENSE"));
    } else if (target === "web") {
        for (const name of ["extension-chrome.zip", "extension-firefox.zip", "DSI-CHAT.user.js", "DSI-CHAT.user.css"]) {
            await cp(path.join(root, "apps/desktop/dist", name), path.join(dir, name));
        }
        await cp(path.join(root, "apps/desktop/dist/browser/chromium-unpacked"), path.join(dir, "chromium-unpacked"), { recursive: true });
        await cp(path.join(root, "apps/desktop/dist/browser/firefox-unpacked"), path.join(dir, "firefox-unpacked"), { recursive: true });
        await cp(path.join(root, "apps/desktop/LICENSE"), path.join(dir, "LICENSE"));
    } else if (target === "desktop") {
        for (const ent of await readdir(path.join(root, "apps/desktop/dist"), { withFileTypes: true })) {
            if (ent.isFile() && !ent.name.startsWith("DSI-CHAT.user") && !ent.name.startsWith("extension-")) {
                await cp(path.join(root, "apps/desktop/dist", ent.name), path.join(dir, ent.name));
            }
        }
        await cp(path.join(root, "apps/desktop/LICENSE"), path.join(dir, "LICENSE"));
    }
    await cp(path.join(root, "THIRD_PARTY_NOTICES.md"), path.join(dir, "THIRD_PARTY_NOTICES.md"));
}
const files = [];
async function walk(dir) {
    for (const ent of await readdir(dir, { withFileTypes: true })) {
        const file = path.join(dir, ent.name);
        if (ent.isDirectory()) await walk(file);
        else if (ent.name !== "checksums.json") {
            const data = await readFile(file);
            files.push({ file: path.relative(release, file).replaceAll("\\", "/"), bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") });
        }
    }
}
await walk(release);
await writeFile(path.join(release, "checksums.json"), JSON.stringify(files, null, 2) + "\n");
console.log(`Packaged ${targets.join(", ")} under release/.`);
