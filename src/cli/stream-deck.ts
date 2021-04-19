//Menu: Prepare Script for Stream Deck
//Description: Creates a .sh file around a script
//Author: John Lindquist
//Twitter: @johnlindquist

let { menu } = await cli("fns")

let createCommand = (launchApp: boolean, script: string) =>
  launchApp
    ? `~/.kit/kar ${script}`
    : `~/.kit/script ~/.kenv/scripts/${script}.js`

let script = await arg(
  "Prepare which script for Stream Deck?",
  menu
)

let launchApp = await arg("Run the script:", [
  {
    name: "with the prompt",
    value: true,
    description: ".sh that opens the prompt",
  },
  {
    name: "no prompt",
    value: false,
    description: ".sh that runs in the background",
  },
])

let name = script.replace(".js", "")

let binPath = kenvPath("deck", name + ".sh")
mkdir("-p", path.dirname(binPath))
await writeFile(binPath, createCommand(launchApp, script))
chmod(755, binPath)
let resolvedPath = path.resolve(binPath)
copy(resolvedPath)

await arg(
  {
    placeholder: `.sh file is ready`,
    ignoreBlur: true,
    hint: `${resolvedPath} copied to clipboard`,
  },
  md(`
* Hit "Enter" to launch Stream Deck UI
* Hit "Escape" to close prompt

### Create a System->Open action and paste here:

![Stream Deck Setup](${kitPath(
    "images",
    "stream-deck.png"
  )})
`)
)

exec(`open -a "Stream Deck.app"`)

export {}
