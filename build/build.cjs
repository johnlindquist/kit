let { build } = require("esbuild")

build({
  entryPoints: ["./src/preload/mac-app.ts"],
  bundle: true,
  platform: "node",
  outfile: "./preload/mac-app.cjs",
  sourcemap: true,
  target: "node15",
  external: Object.keys(
    require("../package.json").dependencies
  ),
  watch: true,
  logLevel: "error",
})

build({
  entryPoints: ["./src/preload/mac-terminal.ts"],
  bundle: true,
  platform: "node",
  outfile: "./preload/mac-terminal.cjs",
  sourcemap: true,
  target: "node15",
  external: Object.keys(
    require("../package.json").dependencies
  ),
  watch: true,
  logLevel: "error",
})
