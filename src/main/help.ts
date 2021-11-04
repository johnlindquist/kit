import { Choice } from "../types/core"
import { kitDocsPath, run } from "../core/utils.js"
import { addPreview } from "../cli/lib/utils.js"

let kitHelpChoices: Choice[] = [
  {
    name: "Get Help",
    description: `Post a question to Script Kit GitHub discussions`,
    value: "get-help",
  },
  {
    name: "Subscribe to Newsletter",
    description: `Receive a newsletter with examples and tips`,
    value: "join",
  },
  {
    name: "Script Kit FAQ",
    description: `Frequently asked questions`,
    value: "faq",
  },
  {
    name: "User Input",
    description: `Take input from and do something with it`,
    value: "user-input",
  },
  {
    name: "Store Data",
    description: `Store user input in .env of a db`,
    value: "store-data",
  },
  {
    name: "Display Data",
    description: `Display data back to the user`,
    value: "display-data",
  },
  {
    name: "Terminal Commands from the App",
    description: `Run bash scripts and other commands`,
    value: "terminal-app",
  },
  {
    name: "Read, Write, and Update Files",
    description: `Run bash scripts and other commands`,
    value: "files",
  },
  {
    name: "Invoke Script with Keyboard Shortcuts",
    description: `Add global keyboard shortcuts to run scripts`,
    value: "shortcuts",
  },
  {
    name: "Schedule Scripts to Run",
    description: `Display data back to the user`,
    value: "schedule",
  },
  {
    name: "Display Your Info",
    description: `Take credit for your work`,
    value: "credit",
  },
  {
    name: "Docs are a working progress...",
    description: `Coming soon...`,
    value: "coming-soon",
  },
  {
    name: "Pull latest docs",
    description: `Pull latest docs from github.com/johnlindquist/kit-docs`,
    value: "pull-docs",
  },
]

let selectedHelp = await arg(
  `Got questions?`,
  addPreview(kitHelpChoices, "help", "p-5")
)

let maybeCli = kitPath(`help`, selectedHelp + ".js")
if (await pathExists(maybeCli)) {
  await run(maybeCli)
} else {
  await edit(
    path.resolve(
      kitDocsPath,
      "docs",
      "help",
      `${selectedHelp}.md`
    )
  )
}

export {}
