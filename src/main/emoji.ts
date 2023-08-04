// Name: Emoji Picker
// Description: Select an Emoji to Paste
// Keyword: e
// Cache: true

let { emoji: e } = await emoji()

if (e) setSelectedText(e)
export {}
