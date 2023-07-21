// Description: Kit.app Settings

import {
  appDbPath,
  escapeShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"

await editor({
  value: await readFile(appDbPath, "utf-8"),
  language: "json",
  shortcuts: [
    escapeShortcut,
    closeShortcut,
    {
      name: "Save",
      key: `${cmd}+s`,
      onPress: async input => {
        await writeFile(appDbPath, input)
      },
      bar: "right",
    },
  ],
})

export {}
