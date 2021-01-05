export const createBinFilePath = name =>
  path.join(env.SIMPLE_BIN_PATH, name)

export const createSourceFilePath = name =>
  path.join(env.SIMPLE_SRC_PATH, name + ".js")

export const createBinFile = async name => {
  let binTemplate = await readFile(
    env.SIMPLE_BIN_TEMPLATE_PATH,
    "utf8"
  )
  binTemplate = Handlebars.compile(binTemplate)
  binTemplate = binTemplate({ name, ...env })

  let binFilePath = createBinFilePath(name)
  await writeFile(binFilePath, binTemplate)
  chmod(755, binFilePath)
}

export let updateEnv = async (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed(
    "-i",
    regex,
    envKey + "=" + envValue,
    env.SIMPLE_ENV_FILE
  )
}

export let writeNewEnv = async (envKey, envValue) => {
  let { ShellString } = await import("shelljs")
  new ShellString("\n" + envKey + "=" + envValue).toEnd(
    env.SIMPLE_ENV_FILE
  )
}

export let setEnv = async (envKey, envValue) => {
  let fn = env[envKey] ? updateEnv : writeNewEnv
  return await fn(envKey, envValue)
}
