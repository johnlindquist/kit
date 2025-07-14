import ava, { type ExecutionContext } from "ava"
import tmp from "tmp-promise"
import { randomUUID } from "node:crypto"
import path, { join } from "node:path"
import os from "node:os"
import { Env } from "../core/enum.js"
import dotenv from "dotenv-flow"
import "../api/kit.js"

await import("../api/global.js")
await import("../api/kit.js")
await import("../api/pro.js")
await import("../api/lib.js")
await import("../platform/base.js")
await import("../target/terminal.js")

import { kenvPath, kitDotEnvPath } from "../core/utils.js"

// Declare the type for test context
interface TestContext {
  dir: { path: string };
  envFile: string;
}

type Context = ExecutionContext<TestContext>

const originalEnv = global.env
const originalArgs = global.args

// biome-ignore lint/suspicious/useAwait: <explanation>
await tmp.withDir(async (dir) => {
  process.env.KENV = dir.path
  process.env.KIT_CONTEXT = "workflow"
  process.env.KENV = join(dir.path, ".kenv")

  // Hard exit if KENV = ~/.kenv to avoid deleting the user's .env
  if (path.resolve(process.env.KENV) === path.resolve(os.homedir(), ".kenv")) {
    throw new Error("KENV is set to ~/.kenv, which is not allowed in tests")
    process.exit(1)
  }

  ava.beforeEach(async (t) => {
    global.kitScript = `${randomUUID()}.js`
    global.__kitDbMap = new Map()
    await ensureDir(kenvPath())
    await ensureDir(kitPath())

    // Create a fresh .env file for each test
    const envFile = kitDotEnvPath()
    await ensureFile(envFile)
    await writeFile(envFile, "poop") // Start with empty .env

    // Set KIT_DOTENV_PATH to point to our test env file
    process.env.KIT_DOTENV_PATH = envFile

    // Reset env object for each test
    // @ts-ignore
    global.env = originalEnv
    global.args = originalArgs

    console.log = t.log
    global.log = t.log
    global.setEnvVar = async (...args) => {
      global.args.push(...args)
      await import(`./../cli/set-env-var.ts?${Math.random()}`)
    }

    t.context = {
      dir,
      envFile,
    }
  })


  ava.serial("should set a new environment variable", async (t: Context) => {
    await global.setEnvVar("HELLO", "WORLD")
    const contents = await readFile(kitDotEnvPath(), "utf-8")
    const { parsed, error } = dotenv.config({
      files: [kitDotEnvPath()],
    })
    t.log({ parsed, error, contents })
    t.is(parsed.HELLO, "WORLD")
  })

  ava.serial("should update an existing environment variable", async (t: Context) => {
    await writeFile(t.context.envFile, "EXISTING_KEY=old_value\n")
    await global.setEnvVar("EXISTING_KEY", "new_value")

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.is(parsed.EXISTING_KEY, "new_value")
  })

  ava.serial("should remove an environment variable", async (t: Context) => {
    await writeFile(t.context.envFile, "TO_REMOVE=value\n")
    await global.setEnvVar("TO_REMOVE", Env.REMOVE)

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.falsy(parsed?.TO_REMOVE)
  })

  ava.serial("should handle special characters in values", async (t: Context) => {
    const specialValue = "test=value with spaces!@#$%^&*()"

    await global.setEnvVar("SPECIAL_KEY", specialValue)

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.is(parsed.SPECIAL_KEY, specialValue)
  })

  ava.serial("should not duplicate entries when updating", async (t: Context) => {
    await writeFile(t.context.envFile, "DUPLICATE_KEY=first_value\n")

    await global.setEnvVar("DUPLICATE_KEY", "second_value")

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.is(parsed.DUPLICATE_KEY, "second_value")


    const contents = await readFile(t.context.envFile, "utf-8")
    const lines = contents.split(/\r?\n/)
    t.is(lines.filter(line => line.startsWith("DUPLICATE_KEY=")).length, 1)
  })

  ava.serial("should handle empty values", async (t: Context) => {
    await global.setEnvVar("EMPTY_KEY", "")

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.is(parsed.EMPTY_KEY, "")
  })

  ava.serial("should not modify other variables when updating", async (t: Context) => {
    await writeFile(t.context.envFile, "KEEP_ME=keep\nUPDATE_ME=old\n")

    await global.setEnvVar("UPDATE_ME", "new")

    const { parsed } = dotenv.config({
      files: [t.context.envFile],
    })
    t.is(parsed.KEEP_ME, "keep")
    t.is(parsed.UPDATE_ME, "new")
  })

  ava.serial("should fail to set an environment variable with an empty key", async (t: Context) => {
    const error = await t.throwsAsync(global.setEnvVar("", "VALUE"))
    t.truthy(error)
    t.regex(error.message, /Invalid environment key/i, "Expected error for empty key")
  })

  ava.serial("should fail to set an environment variable with whitespace-only key", async (t: Context) => {
    const error = await t.throwsAsync(global.setEnvVar("   ", "VALUE"))
    t.truthy(error)
    t.regex(error.message, /Invalid environment key/i, "Expected error for whitespace-only key")

    const contents = await readFile(t.context.envFile, "utf-8")
    t.log({ contents })
    t.truthy(contents)
  })

  ava.serial("should preserve hashes inside quoted values", async (t: Context) => {
    global.log = t.log
    const valueWithHash = "secret#hash"
    await global.setEnvVar("HASHED_VALUE", valueWithHash)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.HASHED_VALUE, valueWithHash)
  })

  ava.serial("should correctly handle multiple '=' characters in the value", async (t: Context) => {
    const valueWithEquals = "part1=part2=part3"
    await global.setEnvVar("MULTIPLE_EQUALS", valueWithEquals)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.MULTIPLE_EQUALS, valueWithEquals)
  })

  ava.serial("should not break if asked to remove a non-existing variable", async (t: Context) => {
    await global.setEnvVar("NON_EXISTENT_KEY", Env.REMOVE)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.falsy(parsed?.NON_EXISTENT_KEY)
  })

  ava.serial("should handle lowercase variable names", async (t: Context) => {
    await global.setEnvVar("lowercase_key", "lower_value")
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.lowercase_key, "lower_value")
  })

  ava.serial("should correctly handle double quotes in the value", async (t: Context) => {
    global.log = t.log
    const valueWithQuotes = `foo"bar"baz`
    await global.setEnvVar("QUOTED_KEY", valueWithQuotes)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.QUOTED_KEY, valueWithQuotes)
  })

  ava.serial("should allow updating the same variable multiple times in a row", async (t: Context) => {
    await global.setEnvVar("REPEATED_KEY", "first_value")
    await global.setEnvVar("REPEATED_KEY", "second_value")
    await global.setEnvVar("REPEATED_KEY", "final_value")

    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.REPEATED_KEY, "final_value")
  })

  ava.serial("should handle a scenario where the .env file initially doesn't contain any valid entries", async (t: Context) => {
    // We start with just "poop" in the file as per beforeEach, meaning no valid VAR= lines
    await global.setEnvVar("BRAND_NEW_KEY", "brand_new_value")
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.BRAND_NEW_KEY, "brand_new_value")
  })

  ava.serial("should handle Windows-style paths", async (t: Context) => {
    const windowsPath = "C:\\Users\\JohnDoe\\Documents\\Project"
    await global.setEnvVar("WIN_PATH", windowsPath)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.WIN_PATH, windowsPath)
  })

  ava.serial("should handle POSIX-style paths", async (t: Context) => {
    const posixPath = "/home/user/documents/project"
    await global.setEnvVar("POSIX_PATH", posixPath)
    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.POSIX_PATH, posixPath)
  })

  ava.serial("should handle paths with spaces", async (t: Context) => {
    const windowsPath = "C:\\Program Files\\My App\\Config"
    const posixPath = "/home/user/My Documents/project"

    await global.setEnvVar("WIN_SPACE_PATH", windowsPath)
    await global.setEnvVar("POSIX_SPACE_PATH", posixPath)

    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.WIN_SPACE_PATH, windowsPath)
    t.is(parsed.POSIX_SPACE_PATH, posixPath)
  })

  ava.serial("should handle network paths and UNC paths", async (t: Context) => {
    const uncPath = "\\\\server\\share\\folder"
    const networkPath = "//server/share/folder"

    await global.setEnvVar("UNC_PATH", uncPath)
    await global.setEnvVar("NETWORK_PATH", networkPath)

    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.UNC_PATH, uncPath)
    t.is(parsed.NETWORK_PATH, networkPath)
  })

  ava.serial("should handle relative paths", async (t: Context) => {
    const winRelative = "..\\parent\\child"
    const posixRelative = "../parent/child"

    await global.setEnvVar("WIN_RELATIVE", winRelative)
    await global.setEnvVar("POSIX_RELATIVE", posixRelative)

    const { parsed } = dotenv.config({ files: [t.context.envFile] })
    t.is(parsed.WIN_RELATIVE, winRelative)
    t.is(parsed.POSIX_RELATIVE, posixRelative)
  })
})
