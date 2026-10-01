import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "node_modules/pnpm/bin/pnpm.cjs");
const task = process.argv[2];
const tasks = ["setup", "build", "mobile", "desktop", "web"];
if (!tasks.includes(task)) throw new Error(`Choose one of: ${tasks.join(", ")}.`);
if (!existsSync(cli)) throw new Error("Run npm install in the repository root first.");

function run(cwd, args) {
    const result = spawnSync(process.execPath, [cli, ...args], { cwd, stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}

const mobile = path.join(root, "apps/mobile");
const desktop = path.join(root, "apps/desktop");
if (task === "setup") {
    run(mobile, ["install", "--frozen-lockfile"]);
    run(desktop, ["install", "--frozen-lockfile"]);
} else {
    if (task === "mobile" || task === "build") run(mobile, ["build", "--release-branch=dsi", "--build-minify"]);
    if (task === "desktop" || task === "build") run(desktop, ["build", "--standalone", "--disable-updater"]);
    if (task === "web" || task === "build") run(desktop, ["buildWeb", "--standalone"]);
    const result = spawnSync(process.execPath, [path.join(root, "scripts/package.mjs"), task], { cwd: root, stdio: "inherit" });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
}
