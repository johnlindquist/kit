//Menu: Share Script as Gist
//Description: Create a gist from the selected script

let { Octokit } = await npm("scriptkit-octokit")

import { selectScript } from "../core/utils.js"

let { filePath, command } = await selectScript(
  `Share which script?`
)

let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
  },
})

let response = await octokit.rest.gists.create({
  files: {
    [command + ".js"]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

copy(
  response.data.files[command + path.extname(filePath)]
    .raw_url
)
console.log(`Copied raw gist url to clipboard`)
await wait(2000)

export {}
