import test from "ava"
import { readFile, rm } from "node:fs/promises"
import { ensureDir } from "fs-extra"
import { tmpPath } from "../api/kit"
import { kenvPath, isFile } from "../core/utils"

test("ensure-scriptlets creates a main.md in kenv if it doesn't exist", async t => {
  const kenvMockPath = tmpPath(".kenv-mock")
  process.env.KENV = kenvMockPath

  await rm(kenvMockPath, { recursive: true, force: true })

  let mainMdPath = kenvPath("scriptlets", "main.md")
  const before = await isFile(mainMdPath)

  await ensureDir(kenvMockPath)
  global.ensureDir = ensureDir
  global.kenvPath = kenvPath

  await import("./ensure-scriptlets")

  await isFile(mainMdPath)
  const mainMd = await readFile(mainMdPath, "utf8")
  t.is(before, false)
  t.is(mainMd, "")
})
