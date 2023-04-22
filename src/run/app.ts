import { configEnv, run } from "../core/utils.js"
import os from "os"

/*
- Force ~/.kit to ~/.kenv/node_modules/@johnlindquist/kit
- Your ~/.kenv/scripts have: import "@johnlindquist/kit" in them
- Those files will load from ~/.kenv/node_modules/@johnlindquist/kit due to the ~/.kenv/package.json
- If these files try to load from ~/.kit, they will duplicate the load causing some issues
- These imports are only here if you don't want to use import "@johnlindquist/kit", but if you do, they load twice if not loaded from the same dir
*/

process.env.KIT = kenvPath(
  "node_modules",
  "@johnlindquist",
  "kit"
)

await import(kitPath("api", "global.js"))
await import(kitPath("api", "kit.js"))
await import(kitPath("api", "pro.js"))
await import(kitPath("api", "lib.js"))

let platform = os.platform()
try {
  await import(kitPath("platform", `${platform}.js`))
} catch (error) {
  // console.log(`No ./platform/${platform}.js`)
}

await import(kitPath("target", "app.js"))

configEnv()
process.title = `Kit Idle - App`
let script = await arg("Path to script:")
process.title = path.basename(script)
await run(script)
