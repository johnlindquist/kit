// Description: Kit.app Settings

import {
  appDbPath,
  backToMainShortcut,
  closeShortcut,
  cmd,
} from "../core/utils.js"

await editor({
  value: await readFile(appDbPath, "utf-8"),
  language: "json",
  shortcuts: [
    backToMainShortcut,
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
