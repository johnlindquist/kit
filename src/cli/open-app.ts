console.log(`open-app spawned`)
await wait(5000)

console.log(`Re-opening Kit.app`)
let { stdout, stderr } = await exec(
  global.isWin
    ? `start Kit.exe`
    : `open /Applications/Kit.app`
)

console.log({ stdout, stderr })

export {}
