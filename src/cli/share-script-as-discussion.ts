//Menu: Share Script for Kit Discussion
//Description: Create a gist and copy discussion content to clipboard

import { Octokit } from "@johnlindquist/kit-internal/scriptkit-octokit"

let { filePath, command } = await selectScript(
  `Share which script?`
)

div(md(`### Creating Gist...`))
setLoading(true)

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

let discussionPost = `
[Open ${command} in Script Kit](${link})

\`\`\`js
${content}
\`\`\`
`

copy(discussionPost)

exec(
  `open 'https://github.com/johnlindquist/kit/discussions/new?category=share'`
)

let message = `Copied ${command} to clipboard as markdown`
await div(
  md(`### ${message}

~~~markdown
${discussionPost}
~~~
`)
)

export {}
