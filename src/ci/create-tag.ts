let { Octokit } = await npm("@octokit/rest")

let octokit = new Octokit({
  request: {
    hook: require("@octokit/plugin-request-log").requestLog,
  },
  auth: await env("GITHUB_TOKEN"),
})

let owner = "johnlindquist"
let repo = "kit"
let branch = "main"
let version = await arg("Version")

let commitRef = await octokit.git.getRef({
  owner,
  repo,
  ref: `heads/${branch}`,
})

let object = commitRef.data.object.sha
let tagCreateResponse = await octokit.git.createTag({
  owner,
  repo,
  tag: version,
  message: version,
  object,
  type: "commit",
})

let createRefResponse = await octokit.git.createRef({
  owner,
  repo,
  ref: `refs/tags/${version}`,
  sha: tagCreateResponse.data.sha,
})

export {}
