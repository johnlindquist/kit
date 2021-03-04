let scriptsPath = "scripts"

if (arg.dir) scriptsPath = `${scriptsPath}/${arg.dir}`

let result = await readdir(kenvPath(scriptsPath), {
  withFileTypes: true,
})

let files = result
  .filter(file => file.isFile())
  .map(file => {
    let name = file.name
    if (arg.dir) name = `${arg.dir}/${name}`
    return name
  })
  .filter(name => name.endsWith(".js"))
let descriptionMarker = "Description:"
let menuMarker = "Menu:"
let shortcutMarker = "Shortcut:"

let getByMarker = marker => lines =>
  lines
    ?.find(line => line.includes(marker))
    ?.split(marker)[1]
    ?.trim()

let choices = files.map(async file => {
  let filePath = kenvPath("scripts", file)
  let fileContents = await readFile(filePath, "utf8")

  let fileLines = fileContents.split("\n")
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

export let scriptsInfo = await Promise.all(choices)
