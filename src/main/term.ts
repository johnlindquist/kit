// Name: Kit Terminal
// Description: Built-in Terminal
// Pass: true

setName(``)
await term({
  command: (arg?.pass as string) || "",
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
