// Name: Sticky Pad
// Description: Take Quick Notes

setName(``)

let stickyPath = kenvPath("sticky.md")
let contents = await ensureReadFile(
  stickyPath,
  `
# Sticky Notes
`.trim()
)

let changed = false

contents = await editor({
  value: contents,
  scrollTo: "bottom",
  // footer: `Escape to save to ${stickyPath}`,
  shortcuts: [
    {
      name: "Save and Close",
      key: "escape",
      onPress: async (input, { inputChanged }) => {
        changed = inputChanged
        await submit(input)
        await hide()
      },
      bar: "right",
    },
  ],
  onAbandon: async (input, { inputChanged }) => {
    changed = inputChanged
    submit(input)
  },
  onInput: async () => {
    changed = true
  },
})

if (changed) await writeFile(stickyPath, contents + "\n")

export {}
