import shelljs from "shelljs";
import path from "node:path";
import { homedir, platform } from "node:os";
import { existsSync, readFileSync } from "node:fs";
import { rimraf } from "rimraf";
import { chmod as fsChmod, writeFile } from "node:fs/promises";
import { execaCommand as exec, type Options } from "execa";
import { ensureDir, move, pathExists } from "fs-extra";
import { downloadAndInstallPnpm } from "./pnpm.ts";

global.log = console.log;
global.warn = console.warn;
global.error = console.error;
global.info = console.info;

let kitPath = (...pathParts) =>
  path.resolve(
    process.env.KIT || path.resolve(homedir(), ".kit"),
    ...pathParts
  );

let options = {
  cwd: kitPath(),
  shell: true,
  stdio: "inherit",
} as Options;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:");
  console.error(formatError(error));
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", formatError(reason));
});

function formatError(error) {
  if (error instanceof Error) {
    const lines = error.stack?.split("\n") || [];
    const filteredLines = lines.filter(
      (line) => !line.includes("node_modules") && !isMinifiedCode(line)
    );
    return filteredLines.join("\n");
  }
  return String(error);
}

function isMinifiedCode(line) {
  // This is a simple heuristic. Adjust as needed.
  return line.length > 200 || line.split(",").length > 10;
}

let originalDir = process.cwd();

let { cd, cp } = shelljs;

// Log which node is running this script using process.version and the node path
console.log(
  `build-kit
  
Running with ${process.argv[0]} version ${process.version}
Path to this script: ${process.argv[1]}
  `
);

const oldKitPath = kitPath() + "-old";
let packageJsonChanged = true; // Default to true for the first run

if (existsSync(kitPath())) {
  console.log(`Found kit at ${kitPath()}, renaming to ${oldKitPath}...`);
  //   check if it exists first

  if (await pathExists(oldKitPath)) {
    await rimraf(oldKitPath); // Ensure old directory is cleared
  }
  await move(kitPath(), oldKitPath);

  // Compare package.json
  try {
    const oldPackageJson = readFileSync(
      path.join(oldKitPath, "package.json"),
      "utf-8"
    );
    const newPackageJson = readFileSync(
      path.join(originalDir, "package.json"),
      "utf-8"
    );
    packageJsonChanged = oldPackageJson !== newPackageJson;
    if (!packageJsonChanged) {
      console.log("package.json has not changed. Using existing node modules.");
    }
  } catch (error) {
    console.error("Error comparing package.json files:", error);
  }
}

await ensureDir(kitPath());

cp("-R", "./root/.", kitPath());
cp("-R", "./build", kitPath());
cp("-R", "./src/types", kitPath());

cp(".npmrc", kitPath());
cp("*.md", kitPath());
cp("package*.json", kitPath());
cp("pnpm-lock.yaml", kitPath());
cp("LICENSE", kitPath());

const kitEditorDtsPath = path.resolve(
  "src",
  "editor",
  "types",
  "kit-editor.d.ts"
);
if (existsSync(kitEditorDtsPath)) {
  const editorTypesPath = kitPath("editor", "types", "kit-editor.d.ts");
  console.log(`Copying ${kitEditorDtsPath} to ${editorTypesPath}`);
  await ensureDir(path.dirname(editorTypesPath));
  cp(kitEditorDtsPath, editorTypesPath);
}

console.log(`Building ESM to ${kitPath()}`);
await exec(`pnpm exec tsc --outDir ${kitPath()}`).catch((e) => {
  console.error(e);
  process.exit(1);
});

console.log(`Building declarations to ${kitPath()}`);
await exec(
  `pnpm exec tsc --project ./tsconfig-declaration.json --outDir ${kitPath()}`
).catch((e) => {
  console.error(e);
  process.exit(1);
});

// Move node_modules, pnpm, and node from .kit-old if package.json is the same
if (!packageJsonChanged && existsSync(oldKitPath)) {
  try {
    console.log("Moving node_modules, pnpm, and node from .kit-old...");
    await move(path.join(oldKitPath, "node_modules"), kitPath("node_modules"), {
      overwrite: true,
    });
    await move(path.join(oldKitPath, "pnpm"), kitPath("pnpm"), {
      overwrite: true,
    });
    await move(path.join(oldKitPath, "nodejs"), kitPath("nodejs"), {
      overwrite: true,
    });
    console.log("Moved node_modules, pnpm, and node successfully.");
  } catch (error) {
    console.error(
      "Error moving node_modules, pnpm, or node:",
      error
    );
    packageJsonChanged = true; // Force reinstallation if move fails
  }
}

// Install dependencies only if package.json has changed
if (packageJsonChanged) {
  console.log("Installing dependencies...");
  try {
    await downloadAndInstallPnpm();
    console.log(
      `Checking node path with pnpm node -e at ${kitPath("pnpm")}`
    );
    await exec(`${kitPath("pnpm")} node -e "console.log(process.execPath)"`, {
      cwd: kitPath(),
      stdio: "inherit",
      env: {
        PNPM_HOME: kitPath(),
        PATH: "",
      },
    });

    const pnpmPath = kitPath("pnpm");
    await exec(`"${pnpmPath}" i --prod`, options);
    await exec(`"${pnpmPath}" i esbuild vite tsx`, options);
  } catch (error) {
    console.error("Error installing dependencies:", error);
    process.exit(1);
  }
}

console.log("Download docs");
await ensureDir(kitPath("data"));
const { default: download } = await import("./download.ts");

try {
  const docsBuffer = await download("https://www.scriptkit.com/data/docs.json");
  await writeFile(kitPath("data", "docs.json"), docsBuffer);
} catch (e) {
  console.error(e);
}

try {
  console.log("Download hot");
  const hotBuffer = await download("https://www.scriptkit.com/data/hot.json");
  await writeFile(kitPath("data", "hot.json"), hotBuffer);
} catch (e) {
  console.error(e);
}

console.log("Write .kitignore");
await writeFile(kitPath(".kitignore"), "*");
cd(originalDir);

try {
  if (process.platform === "win32") {
    await Promise.all([fsChmod(kitPath("bin", "kit.bat"), 0o755)]);
  } else {
    console.log(
      "Make script, kar, bin/k, bin/kit, bin/sk, and override/code/python executable"
    );
    await Promise.all([
      fsChmod(kitPath("script"), 0o755),
      fsChmod(kitPath("kar"), 0o755),
      fsChmod(kitPath("bin", "k"), 0o755),
      fsChmod(kitPath("bin", "kit"), 0o755),
      fsChmod(kitPath("bin", "sk"), 0o755),
      fsChmod(kitPath("override", "code", "python"), 0o755),
    ]);
  }

  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}