//Menu: Share Script for Kit Discussion
//Description: Create a gist and copy discussion content to clipboard

import { authenticate } from "../api/kit.js"

let { filePath, command } = await selectScript(
  `Share which script?`
)

let octokit = await authenticate()

let fileBasename = path.basename(filePath)
const fileExtension = path.extname(filePath).replace('.', '')

div(md(`## Creating Gist...`))
setLoading(true)

let content = await readFile(filePath, "utf8")
let response = await octokit.rest.gists.create({
  files: {
    [fileBasename]: {
      content: await readFile(filePath, "utf8"),
    },
  },
  public: true,
})

const mdLanguage = ['js', 'jsx', 'ts', 'tsx'].includes(fileExtension) ? fileExtension : 'js'

let gistUrl = response.data.files[fileBasename].raw_url

let link = `https://scriptkit.com/api/new?name=${command}&url=${gistUrl}"`

let discussionPost = `
[Open ${command} in Script Kit](${link})

\`\`\`${mdLanguage}
${content}
\`\`\`
`

copy(discussionPost)

setAlwaysOnTop(true)
let message = `Copied ${command} to clipboard as markdown`
await div(
  await highlight(`## ${message}

${discussionPost}
`)
)
export {}
