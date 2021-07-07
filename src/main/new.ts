import { Choice } from "kit-bridge/esm/type"
import { CLI } from "../cli"

let newOptions: Choice<keyof CLI>[] = [
  {
    name: "New from name",
    description: "Enter a script name",
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
  "How would you like to create a script?",
  newOptions
)

if (newOptions.find(script => script.value === cliScript)) {
  await cli(cliScript)
} else {
  await cli("new", cliScript)
}

export {}
