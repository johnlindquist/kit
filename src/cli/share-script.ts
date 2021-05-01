//Menu: Share Script as Gist
//Description: Create a gist from the selected script

let { menu } = await cli("fns")

let script = await arg(
  `Which script do you want to share?`,
  menu
)

let token = await env("GITHUB_GIST_TOKEN", {
  secret: true,
  ignoreBlur: true,
  hint: md(
    `Click to create a [github gist token](https://github.com/settings/tokens/new?scopes=gist&description=kit+share+script+token)`
  ),
  placeholder: chalk`Enter GitHub gist token:`,
})

let scriptPath = kenvPath("scripts", script) + ".js"

let isPublic = await arg("Make gist public?", [
  { name: `No, keep ${script} private`, value: false },
  { name: `Yes, make ${script} public`, value: true },
])

let body: any = {
  files: {
    [script + ".js"]: {
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

exec(`open ` + response.data.html_url)
copy(response.data.files[script + ".js"].raw_url)
setPlaceholder(`Copied raw gist url to clipboard`)
await wait(1000)

export {}
