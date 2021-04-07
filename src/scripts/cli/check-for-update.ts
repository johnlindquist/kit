let result = exec(
  `git rev-list HEAD...origin/main --count`,
  {
    silent: true,
    cwd: kenvPath(),
  }
)
let behindCount = Number(result?.toString() || "0")

send("BEHIND_COUNT", behindCount)
