// Description: Help

import { cmd, run } from "../core/utils.js"
import { addPreview, findDoc } from "../cli/lib/utils.js"

let noChoices = false
let onNoChoices = async input => {
  noChoices = true
  setPanel(
    md(`

# No Tips Found for "${input}"

Ask a question on our [GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/q-a).


`)
  )
}

let selectedHelp = await arg(
  {
    placeholder: `Got questions?`,
    strict: false,
    onNoChoices,
    onChoiceFocus: () => {
      noChoices = false
    },
    input: arg?.input,
    shortcuts: [
      {
        name: "Discuss on GitHub",
        key: `${cmd}+o`,
        onPress: async (input, state) => {
          let doc = await findDoc(
            "help",
            state?.focused?.value
          )

          if (doc?.discussion) {
            browse(doc?.discussion)
          }
        },
      },
    ],
  },
  await addPreview([], "help")
)

if (noChoices) {
  browse(
    "https://github.com/johnlindquist/kit/discussions/categories/q-a"
  )
} else {
  let maybeCli = kitPath(`help`, selectedHelp + ".js")
  if (await pathExists(maybeCli)) {
    await run(maybeCli)
  } else {
    let doc = await findDoc("help", selectedHelp)
    browse(doc?.discussion)
  }
}

export {}
