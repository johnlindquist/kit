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
    placeholder: "Search Google",
    footer: "Enter to open in browser",
  },
  async input => {
    if (!input || input?.length < 2)
      return md(`## Type at least 2 characters`)

    let response = await google.search(input, options)

    return response.results.map(r => {
      return {
        name: r.title,
        description: r.description,
        value: r.url,
      }
    })
  }
)

if (url) exec(`open '${url}'`)
export {}
