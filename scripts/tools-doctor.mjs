import { execFileSync, spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const android = process.argv.includes("--android");
if (process.argv.slice(2).some(arg => arg !== "--android")) throw new Error("Usage: npm run tools:doctor -- [--android]");
const results = [];
async function check(name, action, required = true) {
    try { results.push({ name, required, status: "ready", detail: await action() }); }
    catch (error) { results.push({ name, required, status: "missing-or-failed", detail: error.message }); }
}
function command(file, args) {
    return execFileSync(file, args, { cwd: root, encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
await check("Node", () => {
    if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Node 24 or newer is required");
    return process.version;
});
await check("Git", () => command("git", ["--version"]));
await check("GitHub CLI", () => command("gh", ["--version"]).split(/\r?\n/)[0]);
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
for (const name of ["typescript", "esbuild", "playwright"]) {
    await check(name, () => {
        const installed = require(`${name}/package.json`).version;
        if (installed !== manifest.devDependencies[name]) throw new Error(`Expected ${manifest.devDependencies[name]}, found ${installed}`);
        return installed;
    });
}
await check("TypeScript compiler CLI", () => command(process.execPath, [require.resolve("typescript/bin/tsc"), "--version"]));
await check("Bundler smoke test", async () => {
    const { transform } = await import("esbuild");
    const result = await transform("export const ready: boolean = true;", { loader: "ts", format: "esm" });
    if (!result.code.includes("true")) throw new Error("Transform did not produce code");
    return "TypeScript transformed to JavaScript";
});
await check("Chromium smoke test", async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent("<title>DSI toolchain</title><button>Ready</button>");
        if (await page.title() !== "DSI toolchain") throw new Error("Local page did not render");
        return browser.version();
    } finally { await browser.close(); }
});
const sdk = process.env.ANDROID_HOME || join(root, ".cache", "toolchains", "android-sdk");
await check("Android platform tools", () => command(join(sdk, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb"), ["version"]), android);
await check("Android command-line tools", async () => {
    const source = await readFile(join(sdk, "cmdline-tools", "latest", "source.properties"), "utf8");
    const revision = source.match(/^Pkg.Revision=(.+)$/m)?.[1].trim();
    if (!revision) throw new Error("SDK revision not found");
    if (process.platform === "win32") return `${revision}; ${command(join(sdk, "cmdline-tools", "latest", "bin", "android.exe"), ["--version"])}`;
    return revision;
}, android);
await check("Java", () => {
    const file = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java";
    const result = spawnSync(file, ["-version"], { encoding: "utf8", timeout: 30000 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error("java -version failed");
    const version = (result.stderr || result.stdout).trim().split(/\r?\n/)[0];
    if (!version) throw new Error("Java version was not reported");
    return `${version}; select Gradle/JDK compatibility with the native adapter`;
}, android);
const report = { generatedAt: new Date().toISOString(), platform: process.platform, results,
    deferred: ["Native Android project, Gradle wrapper, SDK platform/build tools and emulator", "Desktop adapter and installer", "iOS builds require a macOS/Xcode host"] };
await mkdir(join(root, ".cache"), { recursive: true });
await writeFile(join(root, ".cache", "toolchain-report.json"), JSON.stringify(report, null, 2) + "\n");
for (const item of results) console.log(`${item.status === "ready" ? "PASS" : item.required ? "FAIL" : "OPTIONAL"} ${item.name}: ${item.detail}`);
if (results.some(item => item.required && item.status !== "ready")) process.exitCode = 1;
