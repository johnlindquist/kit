// Name: Emoji Picker
// Description: Select an Emoji to Paste
// Keyword: em

let emojiJSON = await readJson(
  kitPath("data", "emoji.json")
)
let emojiChoices = emojiJSON.map(emoji => {
  return {
    name: emoji.emoji + " " + emoji.description,
    description: emoji.tags.join(", "),
    value: emoji.emoji,
  }
})
let emoji = await arg(
  {
    placeholder: "Select emoji to paste",
  },
  emojiChoices
)
if (emoji) setSelectedText(emoji)
export {}
