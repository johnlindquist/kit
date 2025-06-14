import ava from 'ava'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { outputTmpFile } from '../api/kit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Helper to compile and run github-workflow.ts with given arguments
async function runGithubWorkflow(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    // Use tsx to run TypeScript directly
    const tsxPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'tsx')
    const scriptPath = path.join(__dirname, 'github-workflow.ts')
    
    const child = spawn(tsxPath, [scriptPath, ...args], {
      env: {
        ...process.env,
        KIT_CONTEXT: 'workflow',
        KIT_TARGET: 'github-workflow',
        // Ensure we have a KENV path
        KENV: process.env.KENV || path.join(process.env.HOME || '', '.kenv')
      }
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 })
    })
  })
}

ava('github-workflow handles create-assets pattern with combined args', async (t) => {
  const name = 'create-assets'
  
  // Create a mock create-assets script
  const scriptContent = `
import "@johnlindquist/kit"

// Name: Create Assets

const version = await arg('Enter the version number')
const platform = await arg('Enter the platform')
const arch = await arg('Enter the architecture')
const release_id = await arg("Enter the release's id")

console.log("CREATE_ASSETS_OUTPUT:", JSON.stringify({
  version,
  platform,
  arch,
  release_id
}))
`.trim()

  await outputTmpFile(`${name}.ts`, scriptContent)
  
  // Test with combined args (as GitHub Actions sends them)
  const result = await runGithubWorkflow([
    'create-assets 1.2.3 ubuntu-latest x64 12345',
    '--trust'
  ])
  
  t.log('Exit code:', result.exitCode)
  t.log('Stdout:', result.stdout)
  t.log('Stderr:', result.stderr)
  
  // Should succeed after the fix
  t.is(result.exitCode, 0, 'Should exit successfully')
  
  // Parse the output
  const outputMatch = result.stdout.match(/CREATE_ASSETS_OUTPUT: (.+)/)
  t.truthy(outputMatch, 'Should find CREATE_ASSETS_OUTPUT in stdout')
  
  if (outputMatch) {
    const output = JSON.parse(outputMatch[1])
    t.deepEqual(output, {
      version: '1.2.3',
      platform: 'ubuntu-latest',
      arch: 'x64',
      release_id: '12345'
    }, 'Should receive all arguments correctly')
  }
})

ava('github-workflow handles test-ts John pattern', async (t) => {
  // Create test-ts script
  const scriptContent = `
import "@johnlindquist/kit"

// Name: Test TS

const name = await arg("Name")
console.log(name)
`.trim()

  await outputTmpFile('test-ts.ts', scriptContent)
  
  // Test the pattern from the GitHub action
  const result = await runGithubWorkflow([
    'test-ts John',
    '--trust'
  ])
  
  t.log('Exit code:', result.exitCode)
  t.log('Stdout:', result.stdout)
  t.log('Stderr:', result.stderr)
  
  // Should succeed after the fix
  t.is(result.exitCode, 0, 'Should exit successfully')
  t.true(result.stdout.includes('John'), 'Should output John')
})