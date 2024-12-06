import { Env } from "../core/enum.js"
import { kitDotEnvPath } from "../core/utils.js"
import chalk from "chalk"

let envKey = args.shift() ?? ""
let envValue = args.shift() ?? ""

if (typeof envKey !== "string" || envKey.trim() === "") {
  log(`
Invalid environment key provided.
Usage: set-env-var [env key:] [env value:]
  `)
  throw new Error("Invalid environment key provided.")
}

if (envValue == null) {
  log(`
Environment value cannot be null or undefined.
Usage: set-env-var [env key:] [env value:]
  `)
  throw new Error("Environment value cannot be null or undefined.")
}

const envFilePath = kenvPath(".env")
const dotEnvPath = kitDotEnvPath()

// Ensure that the dotenv file exists
try {
  await ensureFile(dotEnvPath)
} catch (err) {
  global.log(chalk.red(`Failed to ensure .env file existence: ${err}`))
  process.exit(1)
}

// Helper function to safely read and parse the .env file into an array of lines
async function readEnvFile(filePath: string): Promise<string[]> {
  try {
    const contents = await readFile(filePath, "utf-8")
    return contents.split(/\r?\n/)
  } catch (err) {
    global.log(chalk.red(`Error reading .env file: ${err}`))
    return []
  }
}

// Helper function to write lines array back to the .env file
async function writeEnvFile(filePath: string, lines: string[]): Promise<void> {
  try {
    await writeFile(filePath, lines.join("\n"), "utf-8")
  } catch (err) {
    global.log(chalk.red(`Error writing to .env file: ${err}`))
    throw err
  }
}

// Ensure that we keep both `env` and `process.env` updated only after a successful operation.
function setEnvValue(key: string, value?: string) {
  if (value == null) {
    delete env[key]
    delete process.env[key]
  } else {
    env[key] = value
    process.env[key] = value
  }
}

function formatEnvLine(key:string, value:string) {
  return `${key}="${value}"`;
}

// Update an existing environment variable
async function updateEnv(envKey: string, envValue: string) {
  try {
    const lines = await readEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const lineIndex = lines.findIndex(line => regex.test(line))

    if (lineIndex === -1) {
      global.log(chalk.yellow(`No existing entry found for ${envKey} to update.`))
      return
    }

    lines[lineIndex] = formatEnvLine(envKey, envValue)
    await writeEnvFile(envFilePath, lines)
    setEnvValue(envKey, envValue)
    global.log(chalk`Updated {yellow.bold ${envKey}} in ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to update environment variable ${envKey}: ${err}`))
  }
}

// Append a new environment variable if it does not exist
async function writeNewEnv(envKey: string, envValue: string) {
  try {
    const lines = await readEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const exists = lines.some(line => regex.test(line))
    if (exists) {
      global.log(chalk.yellow(`Entry for ${envKey} already exists. Use updateEnv instead.`))
      return
    }

    lines.push(formatEnvLine(envKey, envValue))
    await writeEnvFile(envFilePath, lines)
    setEnvValue(envKey, envValue)
    global.log(chalk`Set {yellow.bold ${envKey}} in ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to write new environment variable ${envKey}: ${err}`))
  }
}

// Remove an existing environment variable
async function removeEnv(envKey: string) {
  try {
    const lines = await readEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const filteredLines = lines.filter(line => !regex.test(line))

    // If nothing changed, no need to rewrite
    if (filteredLines.length === lines.length) {
      global.log(chalk.yellow(`No entry found for ${envKey} to remove.`))
      return
    }

    await writeEnvFile(envFilePath, filteredLines)
    setEnvValue(envKey, undefined)
    global.log(chalk`Removed {yellow.bold ${envKey}} from ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to remove environment variable ${envKey}: ${err}`))
  }
}

// Determine which operation to perform
try {
  const lines = await readEnvFile(envFilePath)
  const exists = new RegExp(`^${envKey}=.*$`, "m").test(lines.join("\n"))

  if (envValue === Env.REMOVE) {
    await removeEnv(envKey)
  } else if (exists) {
    await updateEnv(envKey, envValue)
  } else {
    await writeNewEnv(envKey, envValue)
  }

} catch (err) {
  global.log(chalk.red(`Unexpected error handling environment variable operation: ${err}`))
}
