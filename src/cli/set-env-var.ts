let envKey = await arg("env key:")
let envValue = await arg("env value:")
let envFile = kenvPath(".env")

let updateEnv = async (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed("-i", regex, envKey + "=" + envValue, envFile)
  env[envKey] = envValue
}

let writeNewEnv = async (envKey, envValue) => {
  await appendFile(envFile, `\n${envKey}=${envValue}`)
  env[envKey] = envValue
}
let exists = env[envKey]
let fn = exists ? updateEnv : writeNewEnv

console.log(
  chalk`${
    exists ? "Updated" : "Set"
  } {yellow.bold ${envKey}} in ${kenvPath(".env")}`
)

await fn(envKey, envValue)

export {}
