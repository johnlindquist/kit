import { Channel } from "../core/enum.js"

export {}

// TODO: Testing opening app from Alfred/Terminal
// TODO: Configure "move" kenv or "create" new kenv in directory
let newKenvParentPath = await path({
  hint: `Select the parent directory that will contain your .kenv`,
})

let moveKenv = await arg("Move ~/.kenv to directory?", [
  "no",
  "yes",
])
if (moveKenv === "yes") {
  await move(
    kenvPath(),
    path.join(newKenvParentPath, ".kenv")
  )
  await replace({
    files: [path.join(newKenvParentPath, ".kenv", ".env")],
    from: /KENV=.*/,
    to: `KENV=${path.join(newKenvParentPath, ".kenv")}`,
  })
}

await sendWait(
  Channel.KENV_NEW_PATH,
  path.join(newKenvParentPath, ".kenv")
)

await div({
  html: md(`# Quit Now?
  
Kit.app must quit before for the new .kenv to be recognized.
  `),
  enter: "Quit",
})

await sendWait(Channel.QUIT_AND_RELAUNCH)
