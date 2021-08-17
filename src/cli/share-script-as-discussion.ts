//Menu: Share Script for Kit Discussion
//Description: Create a gist and copy discussion content to clipboard

let { Octokit } = await npm("scriptkit-octokit")

import { selectScript } from "../utils.js"

let { filePath, command } = await selectScript(
  `Share which script?`
)

let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
  },
})

let scriptJS = `${command}.js`

let content = await readFile(filePath, "utf8")
let response = await octokit.rest.gists.create({
  files: {
    [command + ".js"]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

let gistUrl = response.data.files[scriptJS].raw_url

let link = `https://scriptkit.com/api/new?name=${command}&url=${gistUrl}"`

let discussionPost = `
[Install ${command}](${link})

\`\`\`js
${content}
\`\`\`
`

copy(discussionPost)

exec(
  `open 'https://github.com/johnlindquist/kit/discussions/new?category=share'`
)

await arg({
  placeholder: "Copied script to clipboard",
  hint: `Paste into Discussion. Hit "escape" to close prompt`,
  ignoreBlur: true,
})

export {}
