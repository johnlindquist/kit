let result = ls("-l", env.SIMPLE_SCRIPTS_PATH)
let scripts = result.map(file => file.name)

let choices = scripts.map(name => {
  let descriptionMarker = "Description: "
  let { stdout } = grep(
    descriptionMarker,
    path.join(env.SIMPLE_SCRIPTS_PATH, name)
  )

  let description = stdout
    .substring(0, stdout.indexOf("\n"))
    .substring(
      stdout.indexOf(descriptionMarker) +
        descriptionMarker.length
    )
    .trim()

  name = name.replace(".js", "")
  return {
    name: description ? name + ": " + description : name,
    value: name,
  }
})

if (process.send) {
  process.send(choices)
}
