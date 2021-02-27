let { Octokit } = await npm("@octokit/rest")

const octokit = new Octokit({
  auth: await env("GITHUB_TOKEN"),
})

const owner = "johnlindquist"
const repo = "simplescripts"
const branch = "main"
let version = await arg("Version")

const commitRef = await octokit.git.getRef({
  owner,
  repo,
  ref: `heads/${branch}`,
})

const object = commitRef.data.object.sha
const tagCreateResponse = await octokit.git.createTag({
  owner,
  repo,
  tag: version,
  message: version,
  object,
  type: "commit",
})

const createRefResponse = await octokit.git.createRef({
  owner,
  repo,
  ref: `refs/tags/${version}`,
  sha: tagCreateResponse.data.sha,
})
