/*
# New Scriptlet

Create a new scriptlet

Opens ~/.kenv/scriptlets/scriptlets.md in your selected editor
*/

// Name: New Scriptlet
// Description: Create a new scriptlet
// Log: false

await edit(kenvPath("scriptlets", "scriptlets.md"))
exit()
export {}
