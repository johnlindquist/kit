export let branches = ["main", "beta", "alpha"]
export let plugins = [
  "@semantic-release/commit-analyzer",
  "@semantic-release/release-notes-generator",
  [
    "@semantic-release/changelog",
    {
      changelogFile: "CHANGELOG.md",
    },
  ],
  [
    "@semantic-release/npm",
    {
      npmPublish: true,
    },
  ],
  [
    "@semantic-release/git",
    {
      assets: ["package.json", "CHANGELOG.md"],
      message:
        // eslint-disable-next-line no-template-curly-in-string
        "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    },
  ],
]
