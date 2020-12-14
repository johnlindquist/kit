export const createBinFilePath = name =>
  path.join(process.env.SIMPLE_BIN_PATH, name)

export const createSourceFilePath = name =>
  path.join(process.env.SIMPLE_SRC_PATH, name + ".js")

export const createBinFile = async name => {
  let binTemplate = await readFile(
    process.env.SIMPLE_BIN_TEMPLATE_PATH,
    "utf8"
  )
  binTemplate = Handlebars.compile(binTemplate)
  binTemplate = binTemplate({ name })

  let binFilePath = createBinFilePath(name)
  await writeFile(binFilePath, binTemplate)
  chmod(755, binFilePath)
}

export let updateEnv = (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed(
    "-i",
    regex,
    envKey + "=" + envValue,
    process.env.SIMPLE_ENV_FILE
  )
}

export let writeNewEnv = async envKeyValue => {
  let { ShellString } = await import("shelljs")
  new ShellString("\n" + envKeyValue).toEnd(
    process.env.SIMPLE_ENV_FILE
  )
}
