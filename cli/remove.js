let filePattern = await arg(
  "Enter a pattern. You will be prompted to confirm:"
)

if (filePattern.startsWith("*"))
  filePattern = "." + filePattern

let scripts = await readdir(simplePath("scripts"))

scripts = scripts
  .filter(name => name.match(filePattern))
  .map(name => name.replace(".js", ""))

for await (let script of scripts) {
  const confirm =
    arg?.force ||
    (await prompt({
      type: "confirm",
      name: "value",
      message: chalk`Delete "{red.bold ${script}}"?`,
    }))

  if (confirm) {
    await trash([
      simplePath("bin", script),
      simplePath("scripts", script + ".js"),
    ])
  } else {
    echo(`Skipping ` + script)
  }
}
