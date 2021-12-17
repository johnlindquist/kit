// Description: Git Pull Kenv Repo

let { dirPath: kPath } = await selectKenv()

cd(kPath)
await exec(`git stash`)
await exec(`git pull`)

await getScripts(false)

await mainScript()
// Prompt if stash exists to re-apply changes

export {}
