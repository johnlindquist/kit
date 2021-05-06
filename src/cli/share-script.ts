//Menu: Share Script as Gist
//Description: Create a gist from the selected script

let { scriptValue } = (await cli(
  "fns"
)) as typeof import("./fns")

let command = await arg(
  `Which script do you want to share?`,
  scriptValue("command")
)

let token = await env("GITHUB_GIST_TOKEN", {
  secret: true,
  ignoreBlur: true,
  hint: md(
    `Click to create a [github gist token](https://github.com/settings/tokens/new?scopes=gist&description=kit+share+script+token)`
  ),
  placeholder: chalk`Enter GitHub gist token:`,
})

let scriptPath = kenvPath("scripts", command) + ".js"

let isPublic = await arg("Make gist public?", [
  { name: `No, keep ${command} private`, value: false },
  { name: `Yes, make ${command} public`, value: true },
])

let body: any = {
  files: {
    [command + ".js"]: {
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
copy(response.data.files[command + ".js"].raw_url)
setPlaceholder(`Copied raw gist url to clipboard`)
await wait(1000)

export {}
