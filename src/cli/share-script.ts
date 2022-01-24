//Menu: Share Script as Gist
//Description: Create a gist from the selected script

import { Octokit } from "@johnlindquist/kit-internal/scriptkit-octokit"

let { filePath, command } = await selectScript(
  `Share which script?`
)

let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
  },
})

div(md(`## Creating Gist...`))
setLoading(true)

let response = await octokit.rest.gists.create({
  files: {
    [command + ".js"]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

let { raw_url } =
  response.data.files[command + path.extname(filePath)]

copy(raw_url)

setLoading(false)
await div(
  md(`## Copied Gist to Clipboard

[${raw_url}](${raw_url})
`)
)

export {}
