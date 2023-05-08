//Description: Visit a Kenv Repo
import { getKenvs } from "../core/utils.js"
let kenv = await arg(
  "Remove which kenv",
  (
    await getKenvs()
  ).map(value => ({
    name: path.basename(value),
    value: path.basename(value),
  }))
)
// find remote repo from .git dir
let gitConfigPath = kenvPath(
  "kenvs",
  kenv,
  ".git",
  "config"
)
try {
  let gitConfig = await readFile(gitConfigPath, "utf8")
  let remoteOriginRegex =
    /\[remote "origin"]\s+(?:fetch\s?=.*\s+)?url\s?=\s?(.+)(?:\s+fetch\s?=.*\s+)?/
  let match = gitConfig.match(remoteOriginRegex)
  if (match) {
    let url = match[1]
    if (url.startsWith("git@")) {
      url = url
        .replace("git@", "https://")
        .replace(/(?<=\w|\d):(?=\w|\d)/, "/")
        .replace(/.git$/, "")
    }
    await open(url)
  } else {
    await div(
      md(`## Could not find remote origin in git config
~~~
${gitConfig}
~~~
`)
    )
  }
} catch (error) {
  await div(
    md(`## Failed to read
    
${gitConfigPath}`)
  )
}
//# sourceMappingURL=kenv-visit.js.map
