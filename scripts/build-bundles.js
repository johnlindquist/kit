import { readdir } from "fs/promises"
import esbuild from "esbuild"

let bundles = await readdir("./bundles")

for (let bundle of bundles) {
  esbuild.buildSync({
    entryPoints: [`./bundles/${bundle}`],
    treeShaking: true,
    bundle: true,
    format: "esm",
    outfile: `./src/bundles/${bundle}`.replace(
      /\.ts$/,
      ".js"
    ),
  })
}
