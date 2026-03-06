#!/usr/bin/env node
/**
 * release.mjs — Local release script for SprayTrace
 *
 * Usage:  node tools/release.mjs
 *    or:  npm run release
 *
 * Flow:
 *   1. Read version from package.json
 *   2. Check if that version already exists in the release repo's /history
 *   3. If duplicate, prompt: enter a new version or press Enter to overwrite
 *   4. If new version provided, update package.json
 *   5. Run `npm run build` (Vite static build → /dist)
 *   6. Clear /latest, copy build into /latest
 *   7. Copy build into /history/v{version}
 *   8. Commit + push the release repo
 *   9. Commit + push this (source) repo → triggers GitHub Pages deploy
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------------------------------------------ */
/*  Paths                                                              */
/* ------------------------------------------------------------------ */
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RELEASE_REPO = path.resolve(PROJECT_ROOT, "../../Release/");
const HISTORY_DIR = path.join(RELEASE_REPO, "history");
const LATEST_DIR = path.join(RELEASE_REPO, "latest");
const OUT_DIR = path.join(PROJECT_ROOT, "dist");
const PKG_PATH = path.join(PROJECT_ROOT, "package.json");

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function readPkg() {
  return JSON.parse(fs.readFileSync(PKG_PATH, "utf-8"));
}

function writePkg(pkg) {
  fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

function run(cmd, cwd = PROJECT_ROOT) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getHistoryVersions() {
  if (!fs.existsSync(HISTORY_DIR)) return [];
  return fs
    .readdirSync(HISTORY_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name.replace(/^v/, ""));
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function rmDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function hasUncommittedChanges(cwd = PROJECT_ROOT) {
  const status = execSync("git status --porcelain", {
    cwd,
    encoding: "utf-8",
  }).trim();
  return status.length > 0;
}

function commitIfNeeded(message, cwd = PROJECT_ROOT) {
  if (hasUncommittedChanges(cwd)) {
    run("git add -A", cwd);
    run(`git commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
    return true;
  }
  console.log("  Nothing to commit — already up to date.");
  return false;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */
async function main() {
  // Validate paths
  if (!fs.existsSync(RELEASE_REPO)) {
    console.error(`Release repo not found at: ${RELEASE_REPO}`);
    process.exit(1);
  }

  // 0. Check for uncommitted changes in source repo
  if (hasUncommittedChanges()) {
    console.log("Uncommitted changes detected:\n");
    run("git status --short");
    const msg = await ask("\nEnter a commit message for these changes: ");
    if (!msg) {
      console.error("No commit message provided. Aborting.");
      process.exit(1);
    }
    run("git add -u");
    run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
    console.log("Changes committed.");
  } else {
    console.log("Working tree clean — no uncommitted changes.");
  }

  // 1. Read current version
  const pkg = readPkg();
  let version = pkg.version;
  console.log(`Current package.json version: ${version}`);

  // 2. Check history
  const existing = getHistoryVersions();
  console.log(
    `Existing history versions: ${existing.length ? existing.map((v) => `v${v}`).join(", ") : "(none)"}`,
  );

  if (existing.includes(version)) {
    console.log(`\nVersion ${version} already exists in history.`);
    const answer = await ask(
      `Enter a new version number (or press Enter to overwrite v${version}): `,
    );

    if (answer) {
      if (!/^\d+\.\d+\.\d+/.test(answer)) {
        console.error(`Invalid version format: "${answer}". Expected X.Y.Z`);
        process.exit(1);
      }
      version = answer;
      pkg.version = version;
      writePkg(pkg);
      console.log(`Updated package.json to version ${version}`);
    } else {
      console.log(`Overwriting existing v${version} in history.`);
    }
  }

  // 3. Build
  console.log("\n--- Building Vite static export ---");
  run("npm run build");

  if (!fs.existsSync(OUT_DIR)) {
    console.error(`Build output not found at: ${OUT_DIR}`);
    process.exit(1);
  }

  // 4. Update /latest
  console.log("\n--- Updating /latest ---");
  rmDirSync(LATEST_DIR);
  copyDirSync(OUT_DIR, LATEST_DIR);
  console.log(`Copied build to ${LATEST_DIR}`);

  // 5. Update /history/v{version}
  const historyTarget = path.join(HISTORY_DIR, `v${version}`);
  console.log(`\n--- Updating /history/v${version} ---`);
  rmDirSync(historyTarget);
  copyDirSync(OUT_DIR, historyTarget);
  console.log(`Copied build to ${historyTarget}`);

  // 6. Commit + push release repo
  console.log("\n--- Committing release repo ---");
  commitIfNeeded(`v${version}: release build`, RELEASE_REPO);
  run("git push", RELEASE_REPO);

  // 7. Commit + push source repo (triggers GitHub Pages deploy)
  console.log("\n--- Pushing source repo ---");
  commitIfNeeded(`v${version}: release`, PROJECT_ROOT);
  run("git push", PROJECT_ROOT);

  console.log(`\nDone! v${version} released.`);
  console.log("  - Release repo pushed (latest + history updated)");
  console.log("  - Source repo pushed (GitHub Pages deploy triggered)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
