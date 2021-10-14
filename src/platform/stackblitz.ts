await import("./base.js")

global.edit = async (file, dir, line = 0, col = 0) => {
  await global.$`open ${file} ${dir} ${line} ${col}`
}

global.trash = async fileOrFiles => {
  if (typeof fileOrFiles === "string") {
    await $`rm ${fileOrFiles}`
  }

  if (Array.isArray(fileOrFiles)) {
    for (let file of fileOrFiles) {
      await $`rm ${file}`
    }
  }
}

export {}
