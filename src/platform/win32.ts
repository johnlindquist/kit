global.edit = async (path, dir, line, col) => {
  global.exec(`code ${path} ${dir} ${line} ${col}`)
}

global.browse = async (url: string) => {
  global.exec(`start ${url}`)
}
