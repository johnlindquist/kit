let result = ls("-l", env.SIMPLE_SCRIPTS_PATH)
let files = result.map(file => file.name)
let descriptionMarker = "Description:"
let menuMarker = "Menu:"
let shortcutMarker = "Shortcut:"

let getByMarker = marker => lines =>
  lines
    ?.find(line => line.includes(marker))
    ?.split(marker)[1]
    ?.trim()

let choices = files.map(async file => {
  let fileContents = await readFile(
    simplePath("scripts", file),
    "utf8"
  )

  let fileLines = fileContents.split("\n")
  // .filter(line =>
  //   line.startsWith("/" || line.startsWith(" *"))
  // )

  let description = getByMarker("Description:")(fileLines)
  let menu = getByMarker("Menu:")(fileLines)
  let shortcut = getByMarker("Shortcut:")(fileLines)

  return {
    description,
    menu,
    shortcut,
    file,
    command: file.replace(".js", ""),
  }
})

export let scripts = await Promise.all(choices)
