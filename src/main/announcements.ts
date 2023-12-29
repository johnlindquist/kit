// Name: Annoucements
// Description: Browse Annoucements
// Pass: true
// Cache: true

let noChoices = false
let onNoChoices = async input => {
  noChoices = true
  setPanel(
    md(`# No Examples Found for "${input}"

- Share one! ❤️ [Share on GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/share)
- Request one 💡 [Request on GitHub Discussions](https://github.com/johnlindquist/kit/discussions/categories/ideas)
`)
  )
}

let getHot = async () => {
  let hotPath = kitPath("data", "hot.json")
  if (await isFile(hotPath)) {
    return await readJson(hotPath)
  }

  return []
}

let loadHotChoices = async () => {
  try {
    let hot = await getHot()

    return hot
      .filter(choice => choice?.category?.name !== "Share")
      .map(choice => {
        choice.preview = async () => {
          if (choice?.body) {
            return await highlight(choice?.body)
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
    name: "Announcements",
    placeholder: `Announcements`,
    input: arg?.input,
    preventCollapse: true,
    onNoChoices,
    onChoiceFocus: () => {
      noChoices = false
    },
    shortcuts: [],
    enter: "Open in Browser",
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
