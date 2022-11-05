//Menu: Share Script as scriptkit.com link
//Description: Create a gist and share from ScriptKit
import { authenticate } from "../api/kit.js"

let { filePath, command } = await selectScript(
  `Share which script?`
)

div(md(`## Creating Gist...`))
setLoading(true)

let octokit = await authenticate()

let fileBasename = path.basename(filePath)
setDescription(`Creating link...`)

let response = await octokit.rest.gists.create({
  files: {
    [fileBasename]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

let link = `https://scriptkit.com/api/new?name=${command}&url=${response.data.files[fileBasename].raw_url}`
copy(link)

let message = `Copied share link to clipboard`

setAlwaysOnTop(true)

await div(
  await highlight(`## ${message}

  [${link}](${link})
`)
)

export {}
