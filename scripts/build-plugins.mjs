import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BUILTIN_MANIFESTS } from "../src/plugins/builtins.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(new URL("../dist/shared/", import.meta.url), { recursive: true });
await build({ absWorkingDir: root, entryPoints: ["src/plugins/index.mjs"], outfile: "dist/shared/dsi-plugins.js",
    bundle: true, format: "iife", globalName: "DSIPlugins", platform: "browser", target: "es2022", sourcemap: "external" });
await writeFile(new URL("../dist/shared/plugins.json", import.meta.url), JSON.stringify({ apiVersion: 1, plugins: BUILTIN_MANIFESTS }, null, 2) + "\n");
console.log(`Built original shared plugin core and ${BUILTIN_MANIFESTS.length} browser/Windows manifests`);
