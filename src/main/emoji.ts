// Description: Emoji

setName(``)
let emojiJSON = await readJson(kitPath("db", "emoji.json"))
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

    onEscape: async () => {
      submit(false)
      await mainScript()
    },
  },
  emojiChoices
)
if (emoji) setSelectedText(emoji)
export {}
