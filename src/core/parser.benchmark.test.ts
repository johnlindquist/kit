// parser.benchmark.test.ts

import ava from "ava"
import { promises as fs } from "fs"
import { performance } from "node:perf_hooks"
import { dirname } from "node:path"
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import tmp from "tmp-promise"
import { parseScript } from "./parser.js" // Adjust this import path as necessary

const DEFAULT_BENCHMARK_FILENAME = `${process.env.HOME}/.benchmarks/${
  new URL(import.meta.url).pathname.split('/').pop()?.replace(/\.test\.ts$/, '-benchmark.json')
}`

function loadPreviousResults(filename = DEFAULT_BENCHMARK_FILENAME) {
  if (!existsSync(filename)) return {}
  return JSON.parse(readFileSync(filename, 'utf8'))
}

function saveResults(results, filename = DEFAULT_BENCHMARK_FILENAME) {
  mkdirSync(dirname(filename), { recursive: true })
  writeFileSync(filename, JSON.stringify(results, null, 2), 'utf8')
}

ava.serial("benchmark - parseScript", async (t) => {
  const previousResults = loadPreviousResults()

  // We'll create a temporary directory and write a sample script file to parse.
  await tmp.withDir(async (dir) => {
    const filePath = `${dir.path}/test-script.js`

    // Sample script content can be large or complex to simulate a realistic scenario.
    // We'll include metadata-like comments and some code to simulate real parsing.
    const scriptContent = `
#!/usr/bin/env node
// Name: Sample Test Script
// Description: A script used for benchmarking parseScript
// Shortcut: test-script
// Some code to parse:
function main() {
  console.log("Hello World");
  // preview: true
}
main();
    `.repeat(50) // Repeat multiple times to increase file size and complexity

    await fs.writeFile(filePath, scriptContent, "utf8")

    // Run the benchmark multiple times to get stable measurements
    const runs = 10
    const times = []

    // Warm-up run (not measured)
    await parseScript(filePath)

    for (let i = 0; i < runs; i++) {
      const start = performance.now()
      await parseScript(filePath)
      const end = performance.now()
      times.push(end - start)
    }

    const mean = times.reduce((a, b) => a + b, 0) / runs
    const opsPerSecond = 1000 / mean

    // Compare to previous results if available
    const testName = "parseScript"
    const oldResult = previousResults[testName]
    if (oldResult) {
      const oldOps = oldResult.operationsPerSecond
      const improvement = ((opsPerSecond - oldOps) / oldOps) * 100
      t.log(`Previous OPS: ${oldOps.toFixed(2)}`)
      t.log(`Current OPS: ${opsPerSecond.toFixed(2)}`)
      t.log(`Change: ${improvement > 0 ? '⚡' : '🐌'} ${improvement.toFixed(2)}%`)
    } else {
      t.log("No previous benchmark to compare against.")
    }

    // Write new results
    const newResults = {
      ...previousResults,
      [testName]: {
        timestamp: new Date().toISOString(),
        operationsPerSecond: opsPerSecond,
        meanDurationMs: mean
      }
    }
    saveResults(newResults)

    t.pass()
  }, {
    unsafeCleanup: true
  })
})
