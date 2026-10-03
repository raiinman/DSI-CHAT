import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
if (args.some(arg => arg !== "--android")) throw new Error("Usage: npm run tools:setup -- [--android]");
function run(file, args) {
    const env = { ...process.env };
    // Windows PowerShell must find its own modules, not an inherited PowerShell 7 module path.
    if (file === "powershell.exe") delete env.PSModulePath;
    const result = spawnSync(file, args, { cwd: root, stdio: "inherit", env });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${file} exited with ${result.status}`);
}
const playwrightManifest = require("playwright/package.json");
const playwrightCli = join(dirname(require.resolve("playwright/package.json")), playwrightManifest.bin.playwright);
run(process.execPath, [playwrightCli, "install", "chromium"]);
if (args.includes("--android")) {
    if (process.platform !== "win32") throw new Error("The pinned portable Android downloads currently target Windows; use the official SDK Manager on other hosts");
    const packages = JSON.parse(await readFile(join(root, "docs", "ANDROID_TOOLS.lock.json"), "utf8"));
    const sdk = join(root, ".cache", "toolchains", "android-sdk");
    const downloads = join(root, ".cache", "downloads");
    await mkdir(downloads, { recursive: true });
    const quote = value => "'" + value.replaceAll("'", "''") + "'";
    for (const pkg of packages) {
        const archive = join(downloads, pkg.file);
        let bytes;
        try { bytes = await readFile(archive); } catch (error) { if (error.code !== "ENOENT") throw error; }
        if (!bytes || createHash("sha256").update(bytes).digest("hex") !== pkg.sha256) {
            const response = await fetch(pkg.url, { signal: AbortSignal.timeout(180000) });
            if (!response.ok) throw new Error(`Android download returned HTTP ${response.status}`);
            bytes = Buffer.from(await response.arrayBuffer());
        }
        if (createHash("sha256").update(bytes).digest("hex") !== pkg.sha256 || bytes.length !== pkg.bytes) throw new Error(`Checksum mismatch: ${pkg.id}`);
        await writeFile(archive, bytes);
        const stage = join(downloads, `android-stage-${Date.now()}-${pkg.id}`);
        await mkdir(stage, { recursive: true });
        run("powershell.exe", ["-NoProfile", "-Command", `$ErrorActionPreference='Stop'; Expand-Archive -LiteralPath ${quote(archive)} -DestinationPath ${quote(stage)}`]);
        const source = join(stage, pkg.archiveDirectory);
        const destination = join(sdk, ...pkg.destination.split("/"));
        let exists = true;
        try { await access(destination); } catch (error) { if (error.code === "ENOENT") exists = false; else throw error; }
        if (exists) {
            const current = await readFile(join(destination, "source.properties"), "utf8");
            if (!current.includes(`Pkg.Revision=${pkg.revision}`)) throw new Error(`Existing ${destination} has a different SDK revision; preserve it and choose an upgrade explicitly`);
            console.log(`Retained Android ${pkg.id} ${pkg.revision}`);
        } else {
            await mkdir(join(sdk, ...(pkg.destination.split("/").slice(0, -1))), { recursive: true });
            run("powershell.exe", ["-NoProfile", "-Command", `$ErrorActionPreference='Stop'; Copy-Item -LiteralPath ${quote(source)} -Destination ${quote(destination)} -Recurse`]);
            console.log(`Installed portable Android ${pkg.id} ${pkg.revision}`);
        }
    }
    console.log("Android tools prepared without modifying PATH, connecting a device or installing SDK platforms/emulators.");
}
