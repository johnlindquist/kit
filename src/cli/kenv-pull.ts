// Description: Git Pull Kenv Repo

let { dirPath: kPath } = await selectKenv(
  { placeholder: "Pull to Kenv" },
  /^ignore$/
)

try {
  cd(kPath)
  await exec(`git stash`)
  await exec(`git pull`)

  await getScripts(false)

  await mainScript()
} catch (error) {
  console.log(`Failed to pull ${kPath}`)
}
// Prompt if stash exists to re-apply changes

export {}
