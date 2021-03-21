//Menu: Share Script as ScriptKit.app link
//Description: Create a gist and share from ScriptKit

let { menu, exists, findScript, scripts } = await cli("fns")
let GITHUB_GIST_TOKEN = "GITHUB_GIST_TOKEN"
if (!env[GITHUB_GIST_TOKEN]) {
  show(`
<div class="p-2">
<h1>GitHub token not found</h1>
<div>Create one here (Select the "gist" scope):</div>
<a href="https://github.com/settings/tokens/new">https://github.com/settings/tokens/new</a>
</div>
  `)
}

let token = await env(GITHUB_GIST_TOKEN, {
  secret: true,
  message: chalk`Enter GitHub gist token:`,
})

let script = await arg(
  {
    message: `Which script do you want to share?`,
  },
  menu
)

let scriptPath = kenvPath("scripts", script)

let isPublic = await arg("Make gist public?", [
  { name: `No, keep ${script} private`, value: false },
  { name: `Yes, make ${script} public`, value: true },
])

let body = {
  files: {
    [script]: {
      content: await readFile(scriptPath, "utf8"),
    },
  },
}

if (isPublic) body.public = true

let config = {
  headers: {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${token}`,
  },
}

const response = await post(
  `https://api.github.com/gists`,
  body,
  config
)

let link = `https://scriptkit.app/api/new?name=${script}&url=${response.data.files[script].raw_url}`
exec(`open ` + response.data.html_url)
copy(link)
setPromptText(`Copied share link to clipboard`)
await wait(1000)
