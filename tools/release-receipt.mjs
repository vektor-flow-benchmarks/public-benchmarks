import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const digest = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const checkoutPath = ".release-checkout-receipt.json";
const [mode, platform] = process.argv.slice(2);
if (mode === "checkout") {
  const expected = process.env.RELEASE_SOURCE_REF;
  const revision = git("rev-parse", "HEAD");
  if (!/^[0-9a-f]{40}$/.test(expected ?? "") || revision !== expected)
    throw Error("Release compiler must match the immutable measured source revision");
  if (git("status", "--porcelain", "--untracked-files=no"))
    throw Error("Release source is modified before building");
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  if (version !== "0.4.6") throw Error("Release source version is not 0.4.6");
  writeFileSync(checkoutPath, JSON.stringify({ schema: "vkf.release-provenance", version,
    sourceRevision: revision, sourceModifiedAtCheckout: false,
    runnerRevision: process.env.GITHUB_SHA, buildRunId: process.env.GITHUB_RUN_ID }, null, 2) + "\n");
} else if (mode === "artifacts") {
  if (!["windows-x64", "linux-x64", "macos-arm64", "browser-wasm"].includes(platform))
    throw Error("Unknown release platform");
  const receipt = JSON.parse(readFileSync(checkoutPath, "utf8"));
  if (receipt.sourceRevision !== git("rev-parse", "HEAD")) throw Error("Source revision changed during build");
  const root = "dist/releases";
  const files = readdirSync(root).filter(name => statSync(join(root, name)).isFile()
    && !name.endsWith("-release-receipt.json")).sort().map(name => ({ name,
      bytes: statSync(join(root, name)).size, sha256: digest(join(root, name)) }));
  if (!files.length) throw Error("No release files were built");
  writeFileSync(join(root, platform + "-release-receipt.json"), JSON.stringify({ ...receipt,
    platform, sourceModifiedAfterBuild: !!git("status", "--porcelain", "--untracked-files=no"), files }, null, 2) + "\n");
  console.log("Bound " + files.length + " release files to " + receipt.sourceRevision);
} else throw Error("Expected checkout or artifacts mode");
