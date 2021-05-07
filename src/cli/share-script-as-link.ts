//Menu: Share Script as scriptkit.com link
//Description: Create a gist and share from ScriptKit
let { Octokit } = await npm("scriptkit-octokit")

let { scriptValue } = (await cli(
  "fns"
)) as typeof import("./fns")

let command = await arg(
  `Which script do you want to share?`,
  scriptValue("command")
)

let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_TOKEN_SCRIPT_KIT_GIST",
  },
})

let scriptJS = `${command}.js`

let scriptPath = kenvPath("scripts", scriptJS)

let response = await octokit.rest.gists.create({
  files: {
    [command + ".js"]: {
      content: await readFile(scriptPath, "utf8"),
    },
  },
  public: true,
})

let link = `https://scriptkit.com/api/new?name=${command}&url=${response.data.files[scriptJS].raw_url}`
copy(link)
setPlaceholder(`Copied share link to clipboard`)
await wait(2000)

export {}
