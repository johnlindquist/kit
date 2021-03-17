let scriptsPath = "scripts"

if (arg.dir) scriptsPath = `${scriptsPath}/${arg.dir}`

let result = await readdir(kenvPath(scriptsPath), {
  withFileTypes: true,
})

export let scripts = result
  .filter(file => file.isFile())
  .map(file => {
    let name = file.name
    if (arg.dir) name = `${arg.dir}/${name}`
    return name
  })
  .filter(name => name.endsWith(".js"))
