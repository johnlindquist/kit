// Description: Google

setName(``)

let { default: google } = await import("googlethis")

const options = {
  page: 0,
  safe: false, // hide explicit results?
  additional_params: {
    // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
    hl: "en",
  },
}

let url = await arg(
  {
    input: (flag?.input as string) || "",
    placeholder: "Search Google",
    footer: "Enter to open in browser",
  },
  async input => {
    if (!input || input?.length < 2)
      return md(`### Type at least 2 characters`)

    let response = await google.search(input, options)

    let definitions = response?.dictionary?.definitions
    // let examples = response?.dictionary?.examples
    let description = response?.knowledge_panel?.description
      ?.replace("N/A", "")
      ?.trim()

    let preview = definitions
      ? md(`${definitions?.map(d => `* ${d}`).join("\n")}`)
      : description
      ? md(`${description}`)
      : ""

    return response.results.map(r => {
      let url = new URL(r.url)
      let img = `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`

      return {
        name: r.title,
        description: r.url,
        value: r.url,
        img,
        preview,
      }
    })
  }
)

if (url) exec(`open '${url}'`)
export {}
