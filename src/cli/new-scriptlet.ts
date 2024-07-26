/*
# New Scriptlet

Create a new scriptlet

Opens ~/.kenv/scriptlets/scriptlets.md in your selected editor
*/

// Name: New Scriptlet
// Description: Create a new scriptlet
// Pass: true
// Log: false
// Keyword: np

await ensureDir(kenvPath("scriptlets"))
let scriptletsPath = kenvPath("scriptlets", "scriptlets.md")
if (arg?.pass) {
	let content = await readFile(scriptletsPath, "utf-8")
	let whitespace = ""
	if (content.trim() !== "") {
		whitespace = "\n\n"
	}

	await appendFile(
		scriptletsPath,
		`${whitespace}## ${arg?.pass}

\`\`\`

\`\`\`
`
	)
}
await edit(scriptletsPath)
exit()
export {}
