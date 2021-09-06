let { default: TscWatchClient } = await import(
  "tsc-watch/client.js"
)
let watch = new TscWatchClient()

import { fork } from "child_process"
import path from "path"

let outDir = path.resolve(process.env.KIT, "cjs")

let fixCjs = async () => {
  let child = fork("./scripts/fix-cjs.js")
  child.on("close", () => {
    console.log(`close fork`)
  })
}

watch.on("started", () => {
  console.log("Compilation started")
})

watch.on("first_success", () => {
  console.log("First success!")
})

watch.on("success", fixCjs)

watch.on("compile_errors", () => {
  // Your code goes here...
})

watch.start(
  "--project",
  "./tsconfig-cjs.json",
  "--outDir",
  outDir
)

try {
  // do something...
} catch (e) {
  watch.kill() // Fatal error, kill the compiler instance.
}
