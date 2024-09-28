/*
# Terminal

Run a command in the built-in terminal.
*/

import { Channel } from "../core/enum.js"

// Name: Kit Terminal
// Trigger: >
// Pass: true

setName(``)

await term({
  command: (arg?.pass as string) || "",
  env: process.env,
  shortcuts: [
    {
      name: "Close",
      key: `${cmd}+w`,
      bar: "right",
      onPress: async () => {
        send(Channel.TERM_EXIT, "")        
      },
    },
  ],
})

export {}
