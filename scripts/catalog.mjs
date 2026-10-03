import { mkdir, writeFile } from "node:fs/promises";
import { BUILTIN_MANIFESTS } from "../src/plugins/builtins.mjs";
await mkdir(new URL("../catalog/", import.meta.url), { recursive: true });
await writeFile(new URL("../catalog/features.json", import.meta.url), JSON.stringify({
    implementation: "DSI original",
    apiVersion: 1,
    features: BUILTIN_MANIFESTS.map(manifest => ({ ...manifest, defaultEnabled: false,
        verification: "controlled DOM fixture; live Discord selector compatibility unverified" }))
}, null, 2) + "\n");
console.log("Catalog: " + BUILTIN_MANIFESTS.length + " original browser/Windows plugins.");
