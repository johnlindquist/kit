import test from "ava"
import { parseScript, shortcutNormalizer } from "./utils"
import { outputTmpFile } from "../api/kit"
import slugify from "slugify"

/**
 * [IMPORTANT]
 * These test create files in the tmp directory.
 * They each need unique names or tests will fail
 */

test("parseScript name comment metadata", async t => {
  let name = "Testing Parse Script Comment"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript comment full metadata", async t => {
  let name = "Testing Parse Script Comment Full Metadata"
  let description = "This is a test description"
  let schedule = "0 0 * * *"
  let shortcut = `${cmd}+9`
  let normalizedShortcut = shortcutNormalizer(shortcut)
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

// Name: ${name}
// Description: ${description}
// Schedule: ${schedule}
// Shortcut: ${shortcut}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.description, description)
  t.is(script.schedule, schedule)
  t.is(script.filePath, scriptPath)
  t.is(script.shortcut, normalizedShortcut)
})

test("parseScript export convention metadata name", async t => {
  let name = "Testing Parse Script Convention"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

export const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript global convention metadata name", async t => {
  let name = "Testing Parse Script Convention Global"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  t.is(script.name, name)
  t.is(script.filePath, scriptPath)
})

test("parseScript ignore metadata variable name", async t => {
  let name =
    "Testing Parse Script Convention Ignore Metadata Variable Name"
  let fileName = slugify(name, { lower: true })
  let scriptContent = `
import "@johnlindquist/kit"

const metadata = {
  name: "${name}"
}
  `.trim()

  let scriptPath = await outputTmpFile(
    `${fileName}.ts`,
    scriptContent
  )

  let script = await parseScript(scriptPath)
  // Don't pick up on the metadata variable name, so it's the slugified version
  t.is(script.name, fileName)
  t.is(script.filePath, scriptPath)
})
