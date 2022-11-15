// Name: Calculator
// Description: Evaluate a mathematical expression

import { backToMainShortcut } from "../core/utils.js"

let { default: calc } = await import("advanced-calculator")
let input = args?.shift() || ""

let format = input =>
  `<div class="text-3xl px-4 flex items-center justify-center">${input}</div>`

let result = await arg(
  {
    placeholder: "Calculator",
    enter: "Paste Result",
    shortcuts: [backToMainShortcut],
    input: String(input),
    debounceInput: 250,
    resize: true,
    onEscape: async () => {
      await mainScript()
    },
  },
  async input => {
    input = String(input).trim() || ""
    if (!input || input === "undefined")
      return md(`## Waiting for input...`)
    try {
      if (input?.length < 2) {
        return format(input)
      }
      return format(String(calc.evaluate(input)))
    } catch (error) {
      return md(`
## Failed to parse

~~~bash
${input}
~~~
`)
    }
  }
)
if (result) {
  try {
    setSelectedText(String(calc.evaluate(result)))
  } catch (error) {}
}
