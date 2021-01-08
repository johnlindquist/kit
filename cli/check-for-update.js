let result = exec(
  `git rev-list HEAD...origin/main --count`,
  {
    silent: true,
    cwd: env.SIMPLE_PATH,
  }
)
let behindCount = Number(result?.toString() || "0")

if (process.send) {
  process.send(behindCount)
} else {
  console.log(behindCount)
}
