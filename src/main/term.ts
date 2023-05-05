// Description: Kit Terminal

setName(``)
await term({
  env: process.env,
  ignoreBlur: true,
  shortcuts: [
    {
      name: "Back to Main",
      key: `${cmd}+enter`,
      bar: "left",
    },
    {
      name: "Close",
      key: `${cmd}+w`,
      bar: "right",
      onPress: async () => {
        process.exit()
      },
    },
  ],
})
await mainScript()

export {}
