import { readFile } from "fs/promises"
import { fileURLToPath } from "node:url"
import { extname, resolve, dirname, basename } from "path"

export async function JSXLoad(url) {
  const { build } = await import("esbuild")

  const result = await build({
    entryPoints: [fileURLToPath(url)],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    charset: "utf8",
    write: false,
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
  if (url.endsWith(".kit") && url.includes(".ts?")) {
    // let dir = basename(dirname(url))
    const transform = await JSXLoad(url)
    return transform
  }

  return await defaultLoad(url, context, defaultLoad)
}
