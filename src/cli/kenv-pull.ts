// Description: Git Pull Kenv Repo

let { dirPath: kPath } = await selectKenv()

await $`cd ${kPath} && git stash && git pull`

await getScripts(false)

// Prompt if stash exists to re-apply changes

export { }
