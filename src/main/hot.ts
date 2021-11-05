let url = await arg(
  "Open discussion in browser",
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

exec(`open ${url}`)

export {}
