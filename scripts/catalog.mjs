import { mkdir, writeFile } from "node:fs/promises";
import { FEATURES } from "../src/core.mjs";
await mkdir(new URL("../catalog/", import.meta.url), { recursive: true });
await writeFile(new URL("../catalog/features.json", import.meta.url), JSON.stringify({
    implementation: "DSI original",
    features: FEATURES.map(feature => ({ ...feature, platforms: ["chromium-web"], defaultEnabled: false }))
}, null, 2) + "\n");
console.log("Catalog: " + FEATURES.length + " original browser features.");
