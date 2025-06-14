// loader.ts
import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, basename, resolve } from "node:path";
import { readFile, writeFile, stat } from "node:fs/promises";
import { ensureDir } from "fs-extra";

//───────────────────────────────────────────────────────────────────────────
// Small helpers
//───────────────────────────────────────────────────────────────────────────
const stripQuery = (u: string) => u.split("?")[0];

async function cacheJSXLoad(url: string, cacheDir = "") {
  const fsPath = fileURLToPath(url);
  const cacheJS = join(cacheDir, `${basename(fsPath)}.js`);

  if (cacheDir) {
    try {
      const [src, cached] = await Promise.all([stat(fsPath), stat(cacheJS)]);
      if (cached.mtime >= src.mtime) {
        return { source: await readFile(cacheJS, "utf8"), format: "module" };
      }
    } catch { /* cache miss – fall through */ }
  }

  const result = await JSXLoad(url);
  const comments = (await readFile(fsPath, "utf8"))
    .split("\n")
    .filter(l => l.startsWith("//") && l.includes(":"))
    .join("\n");

  if (cacheDir) await writeFile(cacheJS, `${comments}\n${result.source}`, "utf8");
  return result;
}

export async function JSXLoad(url: string) {
  const fsPath = fileURLToPath(url);
  const ext = fsPath.endsWith(".tsx") || fsPath.endsWith(".jsx");
  const esbuildResult = await build({
    entryPoints: [fsPath],
    bundle: true,
    platform: "node",
    format: "esm",
    loader: ext ? { ".tsx": "tsx", ".jsx": "jsx" } : undefined,
    write: false,
    packages: "external",
    charset: "utf8",
    tsconfigRaw: {
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        moduleResolution: "Node",
        jsx: "react-jsx",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        sourceMap: true
      }
    }
  });

  return { source: esbuildResult.outputFiles[0].text, format: "module" };
}

export async function NoLoad(_url: string) {
  return { source: "export default {}", format: "module" };
}

//───────────────────────────────────────────────────────────────────────────
// MAIN LOADER – new stable API works fine with the old signature here
//───────────────────────────────────────────────────────────────────────────
export async function load(url: string, context, defaultLoad) {
  const isTerminal = process.env.KIT_TARGET === "terminal";
  const cleanPath = stripQuery(url);                    // remove ?now=…
  const isTSFile = cleanPath.endsWith(".ts");
  const isTSXFile = cleanPath.endsWith(".tsx") || cleanPath.endsWith(".jsx");
  const isAppCache = url.endsWith(".kit") && isTerminal; // legacy terminal path

  if (isTSFile || isTSXFile || isAppCache) {
    let cacheDir = "";

    if (!isTerminal) {
      cacheDir = resolve(dirname(fileURLToPath(cleanPath)), ".cache");
      await ensureDir(cacheDir);
    }
    return cacheJSXLoad(cleanPath, cacheDir);
  }

  // Fallback to Node’s default resolver.
  return defaultLoad(url, context, defaultLoad);
}

//───────────────────────────────────────────────────────────────────────────
// Utilities the rest of the codebase already expects
//───────────────────────────────────────────────────────────────────────────
global.attemptImport = async (scriptPath: string, ..._args: string[]) => {
  const cachedArgs = global.args?.slice() ?? [];
  try {
    global.updateArgs?.(_args);
    const href = pathToFileURL(scriptPath).href;
    return await import(`${href}?now=${Date.now()}.kit`);
  } finally {
    global.updateArgs?.(cachedArgs);
  }
};
