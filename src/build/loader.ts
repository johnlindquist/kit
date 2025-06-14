import { fileURLToPath } from "node:url"
import { build } from "esbuild"
import { dirname, join, basename, resolve } from "path"
import { ensureDir } from "fs-extra"
import { readFile, writeFile, stat } from "fs/promises"

async function cacheJSXLoad(url, cacheDir = "") {
  const path = fileURLToPath(url)
  const cachePath = join(cacheDir, basename(path) + ".js")
  if (cacheDir) {
    try {
      const [sourceStat, cacheStat] = await Promise.all([
        stat(path),
        stat(cachePath),
      ])

      if (cacheStat.mtime >= sourceStat.mtime) {
        // Cache is up-to-date
        // global.log(`💪 Loading cached version of ${url}`)
        return {
          source: await readFile(cachePath, "utf8"),
          format: "module",
          shortCircuit: true,
        }
      }
    } catch (error) {
      // If the cache file doesn't exist or there's an error, we'll proceed to build
    }
  }

  // Build and cache the result
  // global.log(`🔨 Building ${url}`)
  const result = await JSXLoad(url)
  // Read any comments from the top of the file and add theme to the top of the cache file
  const contents = await readFile(path, "utf8")
  const metadata = contents
    .split("\n")
    .filter(
      line => line.startsWith("//") && line.includes(":")
    )

  const output = metadata.join("\n") + "\n" + result.source
  if (cacheDir) {
    await writeFile(cachePath, output, "utf8")
  }
  return result
}

export async function JSXLoad(url) {
  const filePath = fileURLToPath(url)
  const isTsxOrJsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
  
  const result = await build({
    entryPoints: [filePath],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    charset: "utf8",
    write: false,
    loader: isTsxOrJsx ? {
      '.tsx': 'tsx',
      '.jsx': 'jsx'
    } : undefined,
    tsconfigRaw: {
      compilerOptions: {
        target: "esnext",
        module: "esnext",
        outDir: "./dist",
        rootDir: "./src",
        moduleResolution: "Node",
        lib: ["esnext"],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        sourceMap: true,
        jsx: "react-jsx",
      },
    },
  })

  return {
    source: result.outputFiles[0].text,
    format: "module",
    shortCircuit: true,
  }
}

export async function NoLoad(url) {
  return {
    source: `export default {}`,
    format: "module",
    shortCircuit: true,
  }
}

export async function load(url, context, defaultLoad) {
  const isTerminal = process.env?.KIT_TARGET === "terminal"
  
  // Handle .tsx and .jsx files
  const urlPath = url.split('?')[0]
  if (urlPath.endsWith('.tsx') || urlPath.endsWith('.jsx')) {
    // Remove the .kit suffix and timestamp query
    const cleanUrl = url.replace(/\?.*\.kit$/, '')
    let cacheDir = ""
    if (!isTerminal) {
      cacheDir = resolve(
        dirname(fileURLToPath(cleanUrl)),
        ".cache"
      )
      await ensureDir(cacheDir)
    }
    const transform = await cacheJSXLoad(cleanUrl, cacheDir)
    return transform
  }
  
  if (
    url.endsWith(".kit") &&
    (url.includes(".ts?") || isTerminal)
  ) {
    let cacheDir = ""
    if (!isTerminal) {
      cacheDir = resolve(
        dirname(fileURLToPath(url)),
        ".cache"
      )
      await ensureDir(cacheDir)
    }
    // const start = performance.now()
    const transform = await cacheJSXLoad(url, cacheDir)
    // const end = performance.now()
    // global.log(
    //   `cacheJSXLoad took ${end - start}ms to complete`
    // )
    return transform
  }

  return defaultLoad(url, context, defaultLoad)
}
