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

    return hot.map(choice => {
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
    name: "Community",
    placeholder: `Community Scripts and Announcements`,
    input: arg?.input,
    onNoChoices,
    onChoiceFocus: () => {
      noChoices = false
    },
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
