// Description: Git Pull Kenv Repo

await $`cd ${home(".kit-docs")} && git stash && git pull`

// Prompt if stash exists to re-apply changes

export {}
