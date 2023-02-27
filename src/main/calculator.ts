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
    shortcuts: [
      backToMainShortcut,
      {
        name: "Copy Result",
        key: `${cmd}+c`,
        onPress: async input => {
          copy(String(calc.evaluate(input)))
        },
        bar: "right",
      },
    ],
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
        let html = format(input)
        return [
          {
            html,
            value: input,
          },
        ]
      }
      let html = format(String(calc.evaluate(input)))
      return [
        {
          html,
          value: input,
        },
      ]
    } catch (error) {
      return [
        {
          name: `Failed to parse: ${input}`,
          value: null,
        },
      ]
    }
  }
)
if (result) {
  try {
    setSelectedText(String(calc.evaluate(result)))
  } catch (error) {}
}
