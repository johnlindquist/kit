let noChoices = false
let onNoChoices = async input => {
  noChoices = true
  setPanel(
    md(`

# No Examples Found for "${input}"

Share one! ❤️ [Share on GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/share)

`)
  )
}

let loadHotChoices = async () => {
  try {
    let hot = await readJson(kitPath("data", "hot.json"))

    return hot.map(choice => {
      choice.preview = async () => {
        if (choice?.body) {
          return await highlight(
            choice?.body,
            "p-5 prose dark:prose-dark prose-sm"
          )
        }

        return ""
      }
      return choice
    })
  } catch (error) {
    return [error.message]
  }
}

let choices = await loadHotChoices()

let url = await arg(
  {
    placeholder: `Community Scripts and Announcements`,
    input: arg?.input,
    onNoChoices,
    onChoiceFocus: () => {
      noChoices = false
    },
  },
  choices
)

if (noChoices) {
  browse(
    `https://github.com/johnlindquist/kit/discussions/categories/share`
  )
} else {
  browse(url)
}

export {}
