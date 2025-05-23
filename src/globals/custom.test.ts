import ava from 'ava'
import '../core/utils.js'
import tmp from 'tmp-promise'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { ensureDir, remove } from 'fs-extra'
import { kenvPath, kitPath } from '../core/utils.js'

// Store original env values to restore later
const originalKENV = process.env.KENV
const originalKIT_CONTEXT = process.env.KIT_CONTEXT

ava.beforeEach(async (t) => {
  // Create isolated test directory for each test
  const tmpDir = await tmp.dir({ unsafeCleanup: true })

  // Set up isolated environment
  process.env.KENV = path.resolve(tmpDir.path, '.kenv')
  process.env.KIT_CONTEXT = 'workflow'

  global.kitScript = `${randomUUID()}.js`
  global.__kitDbMap = new Map()

  // Create necessary directories
  await ensureDir(kenvPath())
  await ensureDir(kitPath())

  // Store cleanup function for this test
  t.context.tmpDir = tmpDir
  t.context.testDir = tmpDir.path

  t.log({
    kenvPath: kenvPath(),
    kitPath: kitPath(),
    testDir: tmpDir.path
  })
})

ava.afterEach(async (t) => {
  // Clean up the isolated test directory
  if (t.context.tmpDir) {
    await t.context.tmpDir.cleanup()
  }
})

ava.after(() => {
  // Restore original environment
  process.env.KENV = originalKENV
  process.env.KIT_CONTEXT = originalKIT_CONTEXT
})

ava('ensureReadFile creates file with default content if empty', async t => {
  const testPath = path.join(t.context.testDir, 'test.txt')
  const defaultContent = 'default content'

  const result = await global.ensureReadFile(testPath, defaultContent)
  t.is(result, defaultContent)

  // Verify content persists
  const secondRead = await global.ensureReadFile(testPath)
  t.is(secondRead, defaultContent)
})

ava('ensureReadFile preserves existing content', async t => {
  const testPath = path.join(t.context.testDir, 'existing.txt')
  const existingContent = 'existing content'

  await global.ensureReadFile(testPath, existingContent)
  const result = await global.ensureReadFile(testPath, 'different default')

  t.is(result, existingContent)
})

ava('ensureReadJson creates JSON file with default content', async t => {
  const testPath = path.join(t.context.testDir, 'test.json')
  const defaultContent = { test: true, count: 42 }

  const result = await global.ensureReadJson(testPath, defaultContent)
  t.deepEqual(result, defaultContent)

  // Verify content persists
  const secondRead = await global.ensureReadJson(testPath, { different: 'content' })
  t.deepEqual(secondRead, defaultContent)
})

ava('ensureReadJson preserves existing JSON content', async t => {
  const testPath = path.join(t.context.testDir, 'existing.json')
  const existingContent = { existing: true, data: 'test' }

  await global.ensureReadJson(testPath, existingContent)
  const result = await global.ensureReadJson(testPath, { different: 'content' })

  t.deepEqual(result, existingContent)
})
