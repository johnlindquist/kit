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
    name: "New Script",
    description: `Create a script using ${
      kitMode() === "ts" ? "TypeScript" : "JavaScript"
    }`,
    value: "new",
  },
  {
    name: "Download Script From URL",
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
  },
  {
    name: "New Kit Environment",
    description: `Create a kenv for scripts`,
    value: "kenv-create",
  },
  {
    name: "Link Existing Kit Environment",
    description: "Link local kenv from your hard drive",
    value: "kenv-add",
  },
  {
    name: "Clone Kit Environment Repository",
    description: `Clone a kenv repo `,
    value: "kenv-clone",
  },
]
let previewChoices: Choice[] = await addPreview(
  newOptions,
  "new"
)

let onNoChoices = async input => {
  if (input) {
    let scriptName = input
      .replace(/[^\w\s]/g, "")
      .replace(/\s/g, "-")
      .toLowerCase()

    setPanel(
      md(`# Create <code>${scriptName}</code>

Create a new script named <code>"${scriptName}"</code>
    `)
    )
  }
}

let cliScript = await arg<keyof CLI>(
  {
    placeholder: "Create a new script",
    strict: false,
    onNoChoices,
    input: arg?.input,
  },
  previewChoices
)

if (cliScript === "docs") {
  await setTab("Docs")
} else if (flag?.discuss) {
  let doc = await findDoc("new", cliScript)
  if (doc?.discussion) {
    browse(doc?.discussion)
  }
} else if (
  newOptions.find(script => script.value === cliScript)
) {
  await run(kitPath(`cli`, cliScript + ".js"))
} else {
  await run(
    `${kitPath("cli", "new")}.js ${cliScript
      .replace(/\s/g, "-")
      .toLowerCase()} --scriptName '${cliScript}'`
  )
}

export {}
