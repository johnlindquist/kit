import { Channel } from "../core/enum.js"

export {}

// TODO: Testing opening app from Alfred/Terminal
// TODO: Configure "move" kenv or "create" new kenv in directory
let newKenvPath = await path({
  hint: `Select the parent directory that will contain your .kenv`,
})

await sendWait(
  Channel.KENV_NEW_PATH,
  path.join(newKenvPath, ".kenv")
)

await div({
  html: md(`# Quit Now?
  
Kit.app must quit before for the new .kenv to be recognized.
  `),
  enter: "Quit",
})

await sendWait(Channel.QUIT_AND_RELAUNCH)
