import { Choice } from "../types/kit"
import { CLI } from "../types/cli"

let newOptions: Choice<keyof CLI>[] = [
  {
    name: "New script (JS)",
    description: "Create a script using JavaScript",
    value: "new",
  },
  {
    name: "New script (TS)",
    description: "Create a script using TypeScript",
    value: "new-ts",
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
  await kit(kitPath(`cli`, cliScript + ".js"))
} else {
  await cli("new", cliScript)
}

export {}
