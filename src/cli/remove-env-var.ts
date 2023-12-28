import { kitDotEnvPath } from "../core/utils.js"

let envKey = await arg("env key:")
let envFile = kenvPath(".env")

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

if (exists) {
  await removeEnv(envKey)
} else {
  global.log(
    chalk`{yellow.bold ${envKey}} not found in ${kenvPath(
      ".env"
    )}`
  )
}
export {}
