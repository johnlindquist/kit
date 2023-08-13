import { kitDotEnvPath } from "../core/utils.js"

let envKey = await arg("env key:")
let envValue = await arg("env value:")
let envFile = kenvPath(".env")
let updateEnv = async (envKey, envValue) => {
  if (env?.[envKey] !== envValue) {
    let regex = new RegExp("^" + envKey + "=.*$")
    sed("-i", regex, envKey + "=" + envValue, envFile)
    env[envKey] = envValue
    process.env[envKey] = envValue
  }
}
let writeNewEnv = async (envKey, envValue) => {
  await appendFile(envFile, `\n${envKey}=${envValue}`)
  env[envKey] = envValue
  process.env[envKey] = envValue
}
let removeEnv = async envKey => {
  let regex = new RegExp("^" + envKey + "=.*$", "gm")
  sed("-i", regex, "", envFile)
  delete env[envKey]
  delete process.env[envKey]
}

let dotEnvPath = kitDotEnvPath()
await ensureFile(dotEnvPath)
let contents = await readFile(dotEnvPath, "utf-8")
let exists = contents.match(
  new RegExp("^" + envKey + "=.*$", "gm")
)
let fn =
  envValue === "__KIT_ClEAR_ENV__"
    ? removeEnv
    : exists
    ? updateEnv
    : writeNewEnv
global.log(
  chalk`${
    exists ? "Updated" : "Set"
  } {yellow.bold ${envKey}} in ${kenvPath(".env")}`
)
await fn(envKey, envValue)
export {}
