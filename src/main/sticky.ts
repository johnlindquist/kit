// Description: Sticky

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
  footer: `Escape to save to ${stickyPath}`,
  onEscape: async (input, { inputChanged }) => {
    changed = inputChanged
    hide()
    submit(input)
  },
  onAbandon: async (input, { inputChanged }) => {
    changed = inputChanged
    submit(input)
  },
  onInput: async () => {
    changed = true
  },
})

if (changed) await writeFile(stickyPath, contents)

export {}
