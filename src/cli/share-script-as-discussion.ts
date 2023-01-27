//Menu: Share Script for Kit Discussion
//Description: Create a gist and copy discussion content to clipboard

import { authenticate } from "../api/kit.js"

let { filePath, command } = await selectScript(
  `Share which script?`
)

div(md(`## Creating Gist...`))
setLoading(true)

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

let discussionPost = `
[Open ${command} in Script Kit](${link})

\`\`\`js
${content}
\`\`\`
`

copy(discussionPost)

open(
  "https://github.com/johnlindquist/kit/discussions/new?category=share"
)

let message = `Copied ${command} to clipboard as markdown`

setAlwaysOnTop(true)
setIgnoreBlur(true)
await div(
  await highlight(`## ${message}

${discussionPost}
`)
)

export {}
