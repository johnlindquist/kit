let { getScripts } = await import("../utils.js")

await trash([
  `!${kenvPath("bin", ".gitignore")}`,
  kenvPath("bin", "*"),
])

let scriptNames = await getScripts()

for await (let script of scriptNames) {
  await cli(
    "create-bin",
    "scripts",
    script.replace(".js", "")
  )
}

export {}
