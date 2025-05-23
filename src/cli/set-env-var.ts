import { Env } from "../core/enum.js"
import { kitDotEnvPath } from "../core/utils.js"
import { safeReadEnvFile, safeWriteEnvFile } from "../core/env-file-lock.js"

// Resilient chalk import with fallback for when dependencies aren't available during installation
let chalk: any
try {
  const chalkModule = await import('chalk')
  chalk = chalkModule.default
} catch (error) {
  // Fallback chalk implementation when package isn't available
  const fallbackChalk = (text: string) => text
  const createChalkFunction = () => {
    const fn = function (strings: TemplateStringsArray | string, ...values: any[]) {
      if (typeof strings === 'string') {
        return strings
      }
      // Handle template literals
      let result = ''
      for (let i = 0; i < strings.length; i++) {
        result += strings[i]
        if (i < values.length) {
          result += values[i]
        }
      }
      return result
    }

    // Add color methods
    fn.red = fallbackChalk
    fn.yellow = fallbackChalk
    fn.green = fallbackChalk
    fn.blue = fallbackChalk
    fn.cyan = fallbackChalk
    fn.magenta = fallbackChalk
    fn.white = fallbackChalk
    fn.gray = fallbackChalk
    fn.grey = fallbackChalk

    return fn
  }

  chalk = createChalkFunction()
}

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

// Ensure envValue is a string
envValue = String(envValue)

const envFilePath = kenvPath(".env")
const dotEnvPath = kitDotEnvPath()

// Ensure that the dotenv file exists
try {
  await ensureFile(dotEnvPath)
} catch (err) {
  global.log(chalk.red(`Failed to ensure .env file existence: ${err}`))
  process.exit(1)
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

const NEEDS_QUOTES_REGEX = /[\s"'`$&|<>^;,\(\)\\]/
function formatEnvLine(key: string, value: string) {
  // Check if value contains spaces, special characters, or hash symbols
  const needsQuotes = NEEDS_QUOTES_REGEX.test(value) || value.includes('#');
  return needsQuotes ? `${key}="${value}"` : `${key}=${value}`;
}

// Update an existing environment variable
async function updateEnv(envKey: string, envValue: string) {
  try {
    const lines = await safeReadEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const lineIndex = lines.findIndex(line => regex.test(line))

    if (lineIndex === -1) {
      global.log(chalk.yellow(`No existing entry found for ${envKey} to update.`))
      return
    }

    lines[lineIndex] = formatEnvLine(envKey, envValue)
    await safeWriteEnvFile(lines, envFilePath)
    setEnvValue(envKey, envValue)
    global.log(chalk`Updated {yellow.bold ${envKey}} in ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to update environment variable ${envKey}: ${err}`))
    throw err
  }
}

// Append a new environment variable if it does not exist
async function writeNewEnv(envKey: string, envValue: string) {
  try {
    const lines = await safeReadEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const exists = lines.some(line => regex.test(line))
    if (exists) {
      global.log(chalk.yellow(`Entry for ${envKey} already exists. Use updateEnv instead.`))
      return
    }

    lines.push(formatEnvLine(envKey, envValue))
    await safeWriteEnvFile(lines, envFilePath)
    setEnvValue(envKey, envValue)
    global.log(chalk`Set {yellow.bold ${envKey}} in ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to write new environment variable ${envKey}: ${err}`))
    throw err
  }
}

// Remove an existing environment variable
async function removeEnv(envKey: string) {
  try {
    const lines = await safeReadEnvFile(envFilePath)
    const regex = new RegExp(`^${envKey}=.*$`)
    const filteredLines = lines.filter(line => !regex.test(line))

    // If nothing changed, no need to rewrite
    if (filteredLines.length === lines.length) {
      global.log(chalk.yellow(`No entry found for ${envKey} to remove.`))
      return
    }

    await safeWriteEnvFile(filteredLines, envFilePath)
    setEnvValue(envKey, undefined)
    global.log(chalk`Removed {yellow.bold ${envKey}} from ${envFilePath}`)
  } catch (err) {
    global.log(chalk.red(`Failed to remove environment variable ${envKey}: ${err}`))
    throw err
  }
}

// Determine which operation to perform with improved error handling
try {
  const lines = await safeReadEnvFile(envFilePath)
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
  // Don't silently fail - re-throw to let the caller know something went wrong
  throw err
}
