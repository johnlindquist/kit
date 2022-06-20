// Description: > Kit Terminal

setName(``)
await term({
  env: process.env,
  footer: `ctrl+c to exit`,
  ignoreBlur: true,
})
await mainScript()

export {}
