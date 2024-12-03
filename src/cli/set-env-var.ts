import { Env } from "../core/enum.js"
import { kitDotEnvPath } from "../core/utils.js"

let envKey = await arg("env key:")
let envValue = await arg("env value:")
let envFile = kenvPath(".env")
let updateEnv = (envKey: string, envValue: string) => {
  if (env?.[envKey] === envValue) { return }

  let regex = new RegExp("^" + envKey + "=.*$")
  sed("-i", regex, envKey + "=" + envValue, envFile)
  env[envKey] = envValue
  process.env[envKey] = envValue
}
let writeNewEnv = async (envKey: string, envValue: string) => {
  if (env?.[envKey] === envValue) { return }

  await appendFile(envFile, `\n${envKey}=${envValue}`)
  env[envKey] = envValue
  process.env[envKey] = envValue
}
let removeEnv = (envKey: string) => {
  if (!env?.[envKey]) { return }

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
  envValue === Env.REMOVE
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
