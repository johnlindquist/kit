//Menu: Paste as Markdown
//Description: Pastes Script as Markdown

import { authenticate } from "../api/kit.js"

let { command, filePath } = await selectScript(
  `Share which script?`
)

let octokit = await authenticate()

let fileBasename = path.basename(filePath)

let content = await readFile(filePath, "utf8")

let response = await octokit.rest.gists.create({
  files: {
    [fileBasename]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

let gistUrl = response.data.files[fileBasename].raw_url

let link = `https://scriptkit.com/api/new?name=${command}&url=${gistUrl}"`

await setSelectedText(
  "```js\n" +
    content.trim() +
    "\n```" +
    `\n\n[Open ${command} in Script Kit](${link})`
)

export {}
