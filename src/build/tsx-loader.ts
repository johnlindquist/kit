import { transformSync } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

/**
 * Compile a .tsx or .jsx file to plain JS that Node can execute.
 * Caches to ~/.kit/cache/tsx for persistence across script runs.
 */
export function compileTSX(file: string): string {
  const src = readFileSync(file, "utf8");
  const hash = createHash('md5').update(src).digest('hex');
  
  // Use the same cache directory as the existing loader
  const cacheDir = path.resolve(path.dirname(file), '.cache');
  const cachePath = path.join(cacheDir, `${path.basename(file)}.${hash}.js`);
  
  // Check if cached version exists
  try {
    return readFileSync(cachePath, 'utf8');
  } catch (e) {
    // Cache miss, need to compile
  }

  const { code } = transformSync(src, {
    loader: file.endsWith(".jsx") ? "jsx" : "tsx",
    target: "node18",
    jsx: "automatic",          // React 17+ transform
    format: "esm",             // Use ESM to match existing loader
    sourcemap: "inline",
  });

  // Ensure cache directory exists
  try {
    require('fs-extra').ensureDirSync(cacheDir);
    writeFileSync(cachePath, code);
  } catch (e) {
    // If we can't cache, that's ok
  }

  return code;
}