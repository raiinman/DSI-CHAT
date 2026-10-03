import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const sources = JSON.parse(await readFile(join(root, "docs", "REFERENCE_SOURCES.json"), "utf8"));
const modules = new Map();
const counts = {};
for (const source of sources) {
    const checkout = join(root, ".cache", "upstreams", source.id);
    const git = args => execFileSync("git", ["-C", checkout, ...args], { encoding: "utf8" }).trim();
    if (git(["rev-parse", "HEAD"]) !== source.revision) throw new Error(`Reference ${source.id} differs from the pinned snapshot; do not silently refresh the audit`);
    counts[source.id] = 0;
    for (const directory of source.pluginRoots) {
        const names = git(["ls-tree", "-d", "--name-only", `${source.revision}:${directory}`]).split(/\r?\n/).filter(name => name && !name.startsWith("_"));
        for (const name of names) {
            counts[source.id]++;
            const item = modules.get(name) || { referenceId: name, status: "untriaged", references: [] };
            item.references.push({ source: source.id, path: `${directory}/${name}` });
            modules.set(name, item);
        }
    }
}
const entries = [...modules.values()].sort((a, b) => a.referenceId.localeCompare(b.referenceId, "en"));
const inventory = {
    scope: "Reference module directory identifiers only. No upstream implementation, plugin descriptions or assets are copied. Entries are not implemented DSI plugins, approved requirements or guaranteed platform compatibility.",
    snapshots: sources,
    summary: { referenceDirectories: counts, uniqueDirectoryIdentifiers: entries.length, sharedVencordEquicordIdentifiers: entries.filter(item => item.references.some(ref => ref.source === "vencord") && item.references.some(ref => ref.source === "equicord")).length },
    mobileScope: "Vendetta is a mobile runtime reference, not a bundled catalog of all external Vendetta plugins. Its native loader and current Discord compatibility require separate investigation.",
    entries
};
const output = JSON.stringify(inventory, null, 2) + "\n";
const destination = join(root, "docs", "REFERENCE_INVENTORY.json");
if (process.argv.includes("--check")) {
    if (await readFile(destination, "utf8") !== output) throw new Error("Reference inventory is out of date");
    console.log("Pinned reference inventory matches");
} else {
    await writeFile(destination, output);
    console.log(JSON.stringify(inventory.summary));
}
