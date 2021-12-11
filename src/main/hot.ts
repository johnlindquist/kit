let url = await arg(
  {
    placeholder: `Community Scripts and Announcements`,
    input: arg?.input,
  },
  async () => {
    try {
      let hot = await readJson(kitPath("data", "hot.json"))

      return hot.map(choice => {
        choice.preview = async () => {
          if (choice?.body) {
            return await highlight(choice?.body, "p-5")
          }

          return ""
        }
        return choice
      })
    } catch (error) {
      return [error.message]
    }
  }
)

browse(url)

export {}
