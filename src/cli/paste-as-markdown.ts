//Menu: Paste as Markdown
//Description: Pastes Script as Markdown

import { Octokit } from "../share/auth-scriptkit.js"

let { command, filePath } = await selectScript(
  `Share which script?`
)

let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
  },
})

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
