let notSupported = async (method: string) => {
  console.warn(`${method} is not supported in the terminal`)
}

global.edit = async (path, dir, line, col) => {
  global.exec(`${env?.KIT_EDITOR || "code"} ${path} ${dir}`)
}

global.browse = async (url: string) => {
  global.exec(`start ${url}`)
}

global.fileSearch = async (
  name,
  { onlyin, kind } = { onlyin: home(), kind: "" }
) => {
  let command = `where /r ${onlyin} *${name.replace(
    /\W/g,
    "*"
  )}*`
  let stdout = ``
  try {
    stdout = (await global.exec(command)).stdout
  } catch (error) {
    stdout = `No results for ${name}`
  }

  return stdout.split("\n").filter(Boolean)
}
