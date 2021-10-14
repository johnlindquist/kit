await import("./base.js")

global.edit = async (file, dir, line = 0, col = 0) => {
  await global.$`open ${file} ${dir} ${line} ${col}`
}

export {}
