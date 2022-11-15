// Name: Kit Terminal
// Description: >_

setName(``)
await term({
  env: process.env,
  ignoreBlur: true,
  shortcuts: [
    {
      name: "Terminate",
      key: `ctrl+c`,
      bar: "right",
    },
  ],
})
await mainScript()

export {}
