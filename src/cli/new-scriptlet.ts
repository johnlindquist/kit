/*
# New Scriptlet

Create a new scriptlet

Opens ~/.kenv/scriptlets/scriptlets.md in your selected editor
*/

// Name: New Scriptlet
// Description: Create a new scriptlet
// Pass: true
// Log: false

let scriptletsPath = kenvPath("scriptlets", "scriptlets.md")
if (arg?.pass) {
	await appendFile(
		scriptletsPath,
		`
    
## ${arg?.pass}

\`\`\`

\`\`\`
`
	)
}
await edit(scriptletsPath)
exit()
export {}
