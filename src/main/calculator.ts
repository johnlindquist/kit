// Description: Calculator

setName(``)
let { default: calc } = await import("advanced-calculator")

let input = await arg("Initial string")

let result = await arg(
  {
    placeholder: "Calculator",
    footer: `Enter to paste result`,
    input: String(input),
    debounceInput: 400,
    onEscape: async () => {
      submit(false)
      await mainScript()
    },
  },
  async input => {
    input = String(input).trim() || ""
    if (!input || input === "undefined")
      return md(`## Waiting for input...`)

    try {
      if (input?.length < 2) {
        return md(`## ${input}`)
      }
      return md(`## ${String(calc.evaluate(input))}`)
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

if (result) setSelectedText(String(calc.evaluate(result)))

export {}
