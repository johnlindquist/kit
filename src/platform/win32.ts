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
  { onlyin = home(), kind = "" }
) => {
  let command = `dir /s /b /a-d *${name}*`
  if (kind) command += ` | findstr /i /r /c:"${kind}"`
  let { stdout } = await global.exec(command, {
    cwd: onlyin,
  })
  return stdout.split(`\n`).filter(Boolean)
}
