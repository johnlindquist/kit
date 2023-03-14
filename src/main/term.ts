// Description: Kit Terminal

setName(``)
await term({
  env: process.env,
  ignoreBlur: true,
})
await mainScript()

export {}
