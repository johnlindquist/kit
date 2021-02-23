let envKey = await arg("env key:")
let envValue = await arg("env value:")
let envFile = simplePath(".env")

let updateEnv = async (envKey, envValue) => {
  let regex = new RegExp("^" + envKey + "=.*$")
  sed("-i", regex, envKey + "=" + envValue, envFile)
}

let writeNewEnv = async (envKey, envValue) => {
  let { ShellString } = await import("shelljs")
  new ShellString("\n" + envKey + "=" + envValue).toEnd(
    envFile
  )
}
let exists = env[envKey]
let fn = exists ? updateEnv : writeNewEnv

console.log(
  chalk`${
    exists ? "Updating" : "Setting"
  } {yellow.bold ${envKey}} to {green ${envValue}}`
)

await fn(envKey, envValue)
