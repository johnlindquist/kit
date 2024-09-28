import { Channel } from "../core/enum.js"
import { cmd } from "../core/utils.js"

let html = md(`
## Browsing Files Requires Full Disk Access

Please verify "Full Disk Access" in your security preferences.

Once enabled, quit Kit.app from the menubar and restart it.
`)

await div({
  html,
  enter: "Back to Main",
  shortcuts: [
    {
      name: "Quit",
      key: `${cmd}+q`,
      bar: "right",
      onPress: async () => {
        send(Channel.QUIT_APP)
      },
    },
  ],
})

await mainScript()

export {}
