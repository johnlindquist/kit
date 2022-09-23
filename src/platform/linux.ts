global.edit = async (path, dir, line, col) => {
  global.exec(`${env.KIT_EDITOR || "code"} ${path} ${dir}`)
}

global.browse = async (url: string) => {
  global.open(url)
}
