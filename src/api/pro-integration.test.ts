import ava from 'ava'
import { stub } from 'sinon'
import { PROMPT, UI, Channel } from '../core/enum.js'

// Create all mocks BEFORE importing the module
const mockKitPrompt = stub()
const mockSend = stub()
const mockFinishPrompt = stub()
const mockWait = stub()
const mockDiv = stub()
const mockSubmit = stub()
const mockMd = stub()

// Set up globals BEFORE importing
global.PROMPT = PROMPT
global.UI = UI
global.Channel = Channel
global.cmd = 'cmd'
global.env = Object.assign(async () => '', {})
global.__kitCurrentUI = null
global.kitPrompt = mockKitPrompt
global.send = mockSend
global.finishPrompt = mockFinishPrompt
global.wait = mockWait
global.div = mockDiv
global.submit = mockSubmit
global.md = mockMd

// Set default mock behaviors
mockWait.resolves()
mockDiv.resolves()
mockMd.returns('')

// NOW import the module after all mocks are set
import('../api/pro.js').then(() => {
  // Reset mocks before each test
  ava.beforeEach(t => {
    mockKitPrompt.reset()
    mockSend.reset()
    mockFinishPrompt.reset()
    mockWait.reset()
    mockDiv.reset()
    mockSubmit.reset()
    mockMd.reset()
    
    // Reset default behaviors
    mockWait.resolves()
    mockDiv.resolves()
    mockMd.returns('')
  })

  ava('captures terminal output with full config', async t => {
    const expectedOutput = 'Hello World\n'

    // Track the flow of data
    const captureFlow = {
      kitPromptCalled: false,
      captureConfigPassed: false,
    }

    mockKitPrompt.callsFake(async (config) => {
      captureFlow.kitPromptCalled = true
      captureFlow.captureConfigPassed = !!config.capture
      
      // Verify the config
      t.is(config.ui, UI.term)
      t.is(config.input, 'echo "Hello World"')
      t.deepEqual(config.capture, {
        mode: 'full',
        stripAnsi: true,
      })

      return { output: expectedOutput, code: 0 }
    })

    const result = await global.term({
      command: 'echo "Hello World"',
      capture: {
        mode: 'full',
        stripAnsi: true,
      }
    })

    t.is(result, expectedOutput)
    t.true(captureFlow.kitPromptCalled)
    t.true(captureFlow.captureConfigPassed)
  })

  ava('maintains backward compatibility with capture: true', async t => {
    const expectedOutput = 'Legacy output'

    mockKitPrompt.callsFake(async (config) => {
      t.is(config.capture, true)
      return { output: expectedOutput, code: 0 }
    })

    const result = await global.term({
      command: 'ls',
      capture: true,
    })

    t.is(result, expectedOutput)
  })

  ava('integrates with all capture modes', async t => {
    const testCases = [
      {
        mode: 'tail',
        config: { mode: 'tail' as const, tailLines: 50 },
        expectedOutput: 'Last 50 lines...',
      },
      {
        mode: 'selection',
        config: { mode: 'selection' as const },
        expectedOutput: 'User selected text',
      },
      {
        mode: 'sentinel',
        config: { 
          mode: 'sentinel' as const,
          sentinelStart: '---BEGIN---',
          sentinelEnd: '---END---',
        },
        expectedOutput: 'Text between markers',
      },
      {
        mode: 'none',
        config: { mode: 'none' as const },
        expectedOutput: '',
      },
    ]

    for (const testCase of testCases) {
      mockKitPrompt.reset()
      mockKitPrompt.callsFake(async (config) => {
        t.deepEqual(config.capture, testCase.config)
        return { output: testCase.expectedOutput, code: 0 }
      })

      const result = await global.term({
        command: 'test-command',
        capture: testCase.config,
      })

      t.is(result, testCase.expectedOutput, 
        `${testCase.mode} mode should return expected output`)
    }
  })

  ava('handles errors in capture flow', async t => {
    const errorOutput = 'Error: Command failed'

    mockKitPrompt.callsFake(async (config) => {
      return { output: errorOutput, code: 1 }
    })

    const result = await global.term({
      command: 'failing-command',
      capture: { mode: 'full' },
    })

    t.is(result, errorOutput)
  })

  ava('passes through all terminal options with capture', async t => {
    let capturedConfig = null

    mockKitPrompt.callsFake(async (config) => {
      capturedConfig = config
      return { output: 'output', code: 0 }
    })

    await global.term({
      command: 'npm test',
      cwd: '/project',
      env: { NODE_ENV: 'test' },
      shell: '/bin/zsh',
      capture: {
        mode: 'full',
        stripAnsi: false,
      },
    })

    t.not(capturedConfig, null)
    t.is(capturedConfig.command, 'npm test')
    t.is(capturedConfig.cwd, '/project')
    t.is(capturedConfig.env.NODE_ENV, 'test')
    t.is(capturedConfig.shell, '/bin/zsh')
    t.deepEqual(capturedConfig.capture, {
      mode: 'full',
      stripAnsi: false,
    })
  })

  ava('handles concurrent terminal captures', async t => {
    let callCount = 0

    mockKitPrompt.callsFake(async (config) => {
      const currentCall = ++callCount
      
      // Simulate different execution times
      await new Promise(resolve => 
        setTimeout(resolve, currentCall === 1 ? 50 : 10)
      )
      
      return { 
        output: `Output from call ${currentCall}`, 
        code: 0 
      }
    })

    // Start multiple captures concurrently
    const captures = await Promise.all([
      global.term({ command: 'cmd1', capture: { mode: 'full' } }),
      global.term({ command: 'cmd2', capture: { mode: 'tail', tailLines: 10 } }),
      global.term({ command: 'cmd3', capture: { mode: 'none' } }),
    ])

    t.is(captures[0], 'Output from call 1')
    t.is(captures[1], 'Output from call 2')
    t.is(captures[2], 'Output from call 3')
    t.is(callCount, 3)
  })

  ava('handles undefined output gracefully', async t => {
    mockKitPrompt.callsFake(async (config) => {
      return { output: undefined, code: 0 }
    })

    const result = await global.term({
      command: 'command',
      capture: true,
    })

    // When output is undefined, we return empty string
    t.is(result, '')
  })

  ava('handles large output efficiently', async t => {
    const largeOutput = 'x'.repeat(1000000) // 1MB

    mockKitPrompt.callsFake(async (config) => {
      let result = { output: largeOutput, code: 0 }
      
      // For tail mode, should only keep last N lines
      if (config.capture?.mode === 'tail') {
        const lines = largeOutput.split('\n')
        const tailLines = config.capture.tailLines || 1000
        result.output = lines.slice(-tailLines).join('\n')
      }
      
      return result
    })

    const startTime = Date.now()
    const result = await global.term({
      command: 'large-output',
      capture: { mode: 'tail', tailLines: 100 },
    })
    const endTime = Date.now()

    // Should complete quickly
    t.true(endTime - startTime < 1000)
    // Large output has no newlines, so tail mode returns the whole thing
    t.is(result, largeOutput)
  })

  ava('term returns empty string when kitPrompt returns nothing', async t => {
    mockKitPrompt.resolves(undefined)

    const result = await global.term({
      command: 'test',
      capture: true,
    })

    t.is(result, '')
  })
})