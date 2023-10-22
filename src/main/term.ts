/*
# Terminal

Run a command in the built-in terminal.
*/

// Name: Kit Terminal
// Trigger: >
// Cache: true

// TODO: Make terminal launch faster
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
        finishScript()
      },
    },
  ],
})
await mainScript()

export {}
