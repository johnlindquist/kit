//Menu: Share Script as Gist
//Description: Create a gist from the selected script

let { Octokit } = await npm("scriptkit-octokit")

let { scriptValue } = await import("../utils.js")

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

let scriptPath = kenvPath("scripts", command) + ".js"

let response = await octokit.rest.gists.create({
  files: {
    [command + ".js"]: {
      content: await readFile(scriptPath, "utf8"),
    },
  },
  public: true,
})

copy(response.data.files[command + ".js"].raw_url)
setPlaceholder(`Copied raw gist url to clipboard`)
await wait(2000)

export {}
