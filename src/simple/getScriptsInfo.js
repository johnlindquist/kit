export let getScriptsInfo = async () => {
  let result = ls(
    "-l",
    path.join(process.env.SIMPLE_PATH, "bin")
  )

  let scripts = result.map(file => file.name)

  let choices = scripts.map(name => {
    let descriptionMarker = "Description: "
    let { stdout } = grep(
      descriptionMarker,
      path.join(
        process.env.SIMPLE_PATH,
        "src",
        name + ".js"
      )
    )

    let description = stdout
      .substring(0, stdout.indexOf("\n"))
      .substring(
        stdout.indexOf(descriptionMarker) +
          descriptionMarker.length
      )
      .trim()

    return {
      name: description ? name + ": " + description : name,
      value: name,
    }
  })

  return choices
}
