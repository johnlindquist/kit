import { isWin } from "../core/utils.js"

console.log(`open-app spawned`)
await wait(5000)

console.log(`Re-opening Kit.app`)
let { stdout, stderr } = await exec(
  isWin ? `start Kit.exe` : `open /Applications/Kit.app`
)

console.log({ stdout, stderr })

export {}
