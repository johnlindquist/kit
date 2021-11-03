import { Choice } from "../types/core"

let url = await arg(
  "Open discussion in browser",
  async () => {
    try {
      let response = await get(
        "https://scriptkit.com/data/showandtell.json"
      )

      return (response?.data as any[])?.map(choice => {
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
