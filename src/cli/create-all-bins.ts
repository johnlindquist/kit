await import("../setup/create-cli-bins.js")

let { scripts }: typeof import("./fns") = await cli("fns")

let scriptNames = await scripts()

for await (let script of scriptNames) {
  await cli(
    "create-bin",
    "scripts",
    script.replace(".js", "")
  )
}

export {}
