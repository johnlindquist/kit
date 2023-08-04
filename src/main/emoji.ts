// Name: Emoji Picker
// Description: Select an Emoji to Paste
// Keyword: e

let { emoji: e } = await emoji()

if (e) setSelectedText(e)
export {}
