"use strict"
import * as esbuild from "esbuild"
import { readFile } from "fs/promises"
import { fileURLToPath } from "node:url"

const extensions = ["jsx", "ts", "tsx", ""]
const getExtension = url => url.split(".").pop()

export async function JSXLoad(url, context, defaultLoad) {
  console.log("JSXLoad", url)

  const result = await esbuild.transform(
    await readFile(fileURLToPath(url), "utf8"),
    { loader: getExtension(url) }
  )

  return {
    source: result.code,
    format: "module",
    shortCircuit: true,
  }
}

export async function load(url, context, defaultLoad) {
  if (extensions.includes(getExtension(url))) {
    const transform = await JSXLoad(
      url,
      context,
      defaultLoad
    )
    return transform
  }
  return await defaultLoad(url, context, defaultLoad)
}
