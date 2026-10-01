import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const entries = [];
for (const [folder, origin] of [["plugins", "Vencord"], ["equicordplugins", "Equicord"]]) {
    const parent = path.join(root, "apps/desktop/src", folder);
    for (const ent of await readdir(parent, { withFileTypes: true })) {
        if (!ent.isDirectory() || ent.name.startsWith("_") || ent.name.startsWith(".")) continue;
        let file;
        let content;
        for (const name of ["index.ts", "index.tsx"]) {
            try {
                content = await readFile(path.join(parent, ent.name, name), "utf8");
                file = name;
                break;
            } catch (error) {
                if (error.code !== "ENOENT") throw error;
            }
        }
        if (!content) continue;
        const definition = content.slice(content.indexOf("export default definePlugin("));
        const name = definition.match(/\bname:\s*["'`]([^"'`]+)["'`]/)?.[1];
        if (!name) throw new Error(`Cannot identify plugin in ${folder}/${ent.name}.`);
        const suffix = ent.name.includes(".") ? ent.name.split(".").at(-1) : null;
        entries.push({
            name, origin,
            source: `apps/desktop/src/${folder}/${ent.name}/${file}`,
            buildTarget: suffix ?? "both",
            desktop: !["web", "browser", "dev", "vesktop", "equibop"].includes(suffix),
            browser: !["desktop", "discordDesktop", "dev", "vesktop", "equibop"].includes(suffix),
            android: "requires-port",
            runtimeValidation: "not-tested"
        });
    }
}
entries.sort((a, b) => a.name.localeCompare(b.name));
const features = {
    schemaVersion: 1,
    desktopPlugins: entries,
    mobileFeatures: [
        { name: "Revenge plugin manager", status: "included", source: "apps/mobile/src/lib/addons/plugins" },
        { name: "Vendetta plugin compatibility", status: "included", source: "apps/mobile/src/core/vendetta" },
        { name: "Themes", status: "included", source: "apps/mobile/src/lib/addons/themes" },
        { name: "Fonts", status: "included", source: "apps/mobile/src/lib/addons/fonts" },
        { name: "Safe mode", status: "included", source: "apps/mobile/src/core/debug/safeMode.ts" },
        { name: "DSI Clean Links", status: "implemented-not-device-tested", source: "apps/mobile/src/core/plugins/dsiCleanLinks/index.ts" },
        { name: "Android account switcher", status: "requires-design-and-device-validation" }
    ]
};
await mkdir(path.join(root, "catalog"), { recursive: true });
await writeFile(path.join(root, "catalog/features.json"), JSON.stringify(features, null, 2) + "\n");
console.log(`Cataloged ${entries.length} desktop/browser plugins with explicit Android port status.`);
