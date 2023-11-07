//Menu: Prepare Script for Stream Deck
//Description: Creates a .sh file around a script
//Author: John Lindquist
//Twitter: @johnlindquist

let createCommand = (
  launchApp: boolean,
  scriptPath: string
) =>
  launchApp
    ? `~/.kit/kar ${scriptPath}`
    : `~/.kit/script ${scriptPath}`

let { command, filePath } = await selectScript(
  "Prepare which script for Stream Deck?"
)

let launchApp = await arg<boolean>("Run the script:", [
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

let binPath = kenvPath("deck", command + ".sh")
await ensureDir(path.dirname(binPath))
await writeFile(binPath, createCommand(launchApp, filePath))
chmod(755, binPath)
let resolvedPath = path.resolve(binPath)
copy(resolvedPath)

let info = `

<div class="text-xs pb-5">
"${resolvedPath}" copied to clipboard
</div>

* Hit "Enter" to launch Stream Deck
* Hit "Escape" to exit

**Create a System->Open action and paste here:**

![Stream Deck Setup](${kitPath(
  "images",
  "stream-deck.png"
)})
`

await div(await highlight(info))

openApp("Elgato Stream Deck.app")

export {}
