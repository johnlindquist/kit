import { Choice } from "../types/core"
import { CLI } from "../cli"
import { kitMode, run } from "../core/utils.js"
import { addPreview, findDoc } from "../cli/lib/utils.js"

setFlags({
  discuss: {
    name: "Discuss topic on Kit Dicussions",
    description: "Open discussion in browser",
  },
})

let newOptions: Choice<keyof CLI>[] = [
  {
    name: "New script",
    description: `Create a script using ${
      kitMode() === "ts" ? "TypeScript" : "JavaScript"
    }`,
    value: "new",
  },
  {
    name: "New from url",
    description: "Enter a url then name it",
    value: "new-from-url",
  },
  {
    name: "Browse Community Examples",
    description:
      "Visit scriptkit.com/scripts/ for a variety of examples",
    value: "browse-examples",
  },
  {
    name: "Create Scripts from Docs",
    description:
      "The Docs tab has many helpful snippets to choose from",
    value: "docs",
    preview: async () => {
      return highlight(`
# Snippets in Docs      

Head on over to the \`Docs\` tab for many useful snippets to help you get started.
      `)
    },
  },
]
let previewChoices: Choice[] = await addPreview(
  newOptions,
  "new"
)
let cliScript = await arg<keyof CLI>(
  {
    placeholder: "Create a new script",
    strict: false,
  },
  previewChoices
)

if (cliScript === "docs") {
  await setTab("Docs")
} else if (flag?.discuss) {
  let doc = await findDoc("new", cliScript)
  if (doc?.discussion) {
    await $`open ${doc.discussion}`
  }
} else if (
  newOptions.find(script => script.value === cliScript)
) {
  await run(kitPath(`cli`, cliScript + ".js"))
} else {
  await cli("new", cliScript)
}

export {}
