import { Choice } from "../types/core"
import { CLI } from "../cli"
import { kitMode, run } from "../core/utils.js"

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
]
let cliScript = await arg<keyof CLI>(
  {
    placeholder: "Create a new script",
    strict: false,
  },
  newOptions
)

if (newOptions.find(script => script.value === cliScript)) {
  await run(kitPath(`cli`, cliScript + ".js"))
} else {
  await cli("new", cliScript)
}

export {}
