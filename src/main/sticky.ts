/* 
# Sticky Notes

Opens a quick editor for taking notes. 

Notes are saved to `~/.kenv/sticky.md`.
*/

// Name: Sticky Pad
// Description: Take Quick Notes
// Cache: true
// Trigger: ,

let stickyPath = kenvPath("sticky.md")
let contents = await ensureReadFile(
	stickyPath,
	`
# Sticky Notes
`.trim()
)

let changed = false

if (arg?.pass) {
	contents = `${contents}
${arg?.pass}`
}

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
				await hide()
				await submit(input)
			},
			bar: "right"
		}
	],
	onAbandon: async (input, { inputChanged }) => {
		changed = inputChanged
		submit(input)
	},
	onInput: async () => {
		changed = true
	}
})

if (changed || arg?.pass) {
	await writeFile(stickyPath, contents + "\n")
}

export {}
