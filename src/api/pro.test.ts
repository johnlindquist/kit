import ava from 'ava'
import { stub } from 'sinon'
import { PROMPT, UI } from '../core/enum.js'

// Set up minimal globals before any imports
global.PROMPT = PROMPT
global.UI = UI
global.cmd = 'cmd'
global.env = Object.assign(() => Promise.resolve(''), { PATH: '/usr/bin' }) as any
global.__kitCurrentUI = null

// Mock functions
const mockKitPrompt = stub()
const mockSendWait = stub()
const mockExit = stub()
const mockSend = stub()
const mockWait = stub()
const mockDiv = stub()
const mockSubmit = stub()
const mockMd = stub()

// Assign mocks to global
global.kitPrompt = mockKitPrompt
global.sendWait = mockSendWait
global.exit = mockExit as any
global.send = mockSend
global.wait = mockWait
global.div = mockDiv
global.submit = mockSubmit
global.md = mockMd

// Set up mock returns
mockWait.resolves()
mockDiv.resolves()
mockMd.returns('')

// Import the module AFTER setting up all globals
await import('../api/pro.js')

ava.beforeEach(t => {
  // Reset all stubs
  mockKitPrompt.reset()
  mockSendWait.reset()
  mockExit.reset()
  mockSend.reset()
  mockWait.reset()
  mockDiv.reset()
  mockSubmit.reset()
  mockMd.reset()
  
  // Reset mock returns
  mockWait.resolves()
  mockDiv.resolves()
  mockMd.returns('')
})

ava.serial('term should return captured output when capture is enabled', async t => {
  const expectedOutput = 'npm install completed successfully'
  
  // Mock kitPrompt to return an object with output
  mockKitPrompt.resolves({ output: expectedOutput })

  const result = await global.term({
    command: 'npm install',
    capture: true
  })

  t.is(result, expectedOutput)
  
  // Verify kitPrompt was called with correct parameters
  t.true(mockKitPrompt.called)
  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'npm install')
  t.is(call.args[0].capture, true)
})

ava.serial('term should support different capture modes', async t => {
  const expectedOutput = 'last few lines of output'
  
  mockKitPrompt.resolves({ output: expectedOutput })

  const result = await global.term({
    command: 'long-running-command',
    capture: {
      mode: 'tail',
      tailLines: 100,
      stripAnsi: true
    }
  })

  t.is(result, expectedOutput)
  
  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'long-running-command')
  t.deepEqual(call.args[0].capture, {
    mode: 'tail',
    tailLines: 100,
    stripAnsi: true
  })
})

ava.serial('term should handle capture with sentinels', async t => {
  const expectedOutput = 'content between markers'
  
  mockKitPrompt.resolves({ output: expectedOutput })

  const result = await global.term({
    command: 'echo "START"; echo "important"; echo "END"',
    capture: {
      mode: 'sentinel',
      sentinelStart: 'START',
      sentinelEnd: 'END'
    }
  })

  t.is(result, expectedOutput)
  
  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'echo "START"; echo "important"; echo "END"')
  t.is(call.args[0].capture.mode, 'sentinel')
  t.is(call.args[0].capture.sentinelStart, 'START')
  t.is(call.args[0].capture.sentinelEnd, 'END')
})

ava.serial('term should work without capture (legacy behavior)', async t => {
  const expectedOutput = ''
  
  // When capture is not specified, it should still work but return empty string
  mockKitPrompt.resolves({ output: expectedOutput })

  const result = await global.term('npm install')

  t.is(result, expectedOutput)
  
  // Verify correct parameters
  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'npm install')
  t.is(call.args[0].capture, undefined)
})

ava.serial('term should handle capture mode none', async t => {
  mockKitPrompt.resolves({ output: '' })

  const result = await global.term({
    command: 'npm install',
    capture: {
      mode: 'none'
    }
  })

  t.is(result, '')
  
  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'npm install')
  t.is(call.args[0].capture.mode, 'none')
})

ava.serial('term should preserve other terminal options', async t => {
  mockKitPrompt.resolves({ output: 'output' })

  await global.term({
    command: 'npm test',
    cwd: '/project',
    env: { NODE_ENV: 'test' },
    capture: true
  })

  const call = mockKitPrompt.lastCall
  t.is(call.args[0].input, 'npm test')
  t.is(call.args[0].command, 'npm test')
  t.is(call.args[0].cwd, '/project')
  t.is(call.args[0].env.NODE_ENV, 'test')
  t.is(call.args[0].capture, true)
})

ava.serial('term should handle undefined output gracefully', async t => {
  // Simulate old behavior where output might be undefined
  mockKitPrompt.resolves({ output: undefined })

  const result = await global.term({ command: 'command', capture: true })

  // Should return empty string when output is undefined
  t.is(result, '')
})