import { Choice } from "../types/core"
import { kitDocsPath, run } from "../core/utils.js"
import { addPreview, findDoc } from "../cli/lib/utils.js"

setFlags({
  discuss: {
    name: "Discuss topic on Kit Dicussions",
    description: "Open discussion in browser",
  },
})

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
  // {
  //   name: "User Input",
  //   description: `Take input from and do something with it`,
  //   value: "user-input",
  // },
  // {
  //   name: "Store Data",
  //   description: `Store user input in .env of a db`,
  //   value: "store-data",
  // },
  // {
  //   name: "Display Data",
  //   description: `Display data back to the user`,
  //   value: "display-data",
  // },
  // {
  //   name: "Terminal Commands from the App",
  //   description: `Run bash scripts and other commands`,
  //   value: "terminal-app",
  // },
  // {
  //   name: "Read, Write, and Update Files",
  //   description: `Run bash scripts and other commands`,
  //   value: "files",
  // },
  // {
  //   name: "Invoke Script with Keyboard Shortcuts",
  //   description: `Add global keyboard shortcuts to run scripts`,
  //   value: "shortcuts",
  // },
  // {
  //   name: "Schedule Scripts to Run",
  //   description: `Display data back to the user`,
  //   value: "schedule",
  // },
  // {
  //   name: "Display Your Info",
  //   description: `Take credit for your work`,
  //   value: "credit",
  // },
  {
    name: "Download Latest Docs",
    description: `Pull latest docs.json from scriptkit.com`,
    value: "download-docs",
  },
]

let noChoices = false
let onNoChoices = async input => {
  noChoices = true
  setPanel(
    md(`

# No Docs Found for "${input}"

Ask a question on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a).


`)
  )
}

let onChoices = async input => {
  setPanel(``)
  noChoices = false
}

let selectedHelp = await arg(
  {
    placeholder: `Got questions?`,
    strict: false,
    onNoChoices,
    onChoices,
    input: arg?.input,
  },
  await addPreview(kitHelpChoices, "help")
)

if (noChoices) {
  browse(
    "https://github.com/johnlindquist/kit/discussions/categories/q-a"
  )
} else {
  let maybeCli = kitPath(`help`, selectedHelp + ".js")
  if (flag?.discuss) {
    let doc = await findDoc("help", selectedHelp)

    if (doc?.discussion) {
      browse(doc?.discussion)
    }
  } else if (await pathExists(maybeCli)) {
    await run(maybeCli)
  } else {
    let doc = await findDoc("help", selectedHelp)
    browse(doc?.discussion)
  }
}

export {}
