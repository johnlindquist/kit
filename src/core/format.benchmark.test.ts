import ava from "ava"
import { loadPreviousResults, saveResults } from "./test-utils"
import tmp from 'tmp-promise'
import { formatChoices } from "./format"

ava.serial('benchmark - formatChoices', async (t) => {
    const previousResults = await loadPreviousResults()
  
    // Some sample data to benchmark
    const largeInput = Array.from({ length: 1000 }, (_, i) => ({
      name: `Item ${i}`,
      value: `value${i}`,
      description: `This is item number ${i}`
    }))
  
    // Run the benchmark multiple times to get stable measurements
    const runs = 10
    const times = []
  
    // Warm-up run (not measured)
    formatChoices(largeInput)
  
    for (let i = 0; i < runs; i++) {
      const start = performance.now()
      formatChoices(largeInput)
      const end = performance.now()
      times.push(end - start)
    }
  
    const mean = times.reduce((a, b) => a + b, 0) / runs
    const opsPerSecond = (1000 / mean)  // If each run counts as 1 operation
  
    // Compare to previous results if available
    const testName = 'formatChoices'
    const oldResult = previousResults[testName]
    if (oldResult) {
      const oldOps = oldResult.operationsPerSecond
      const improvement = ((opsPerSecond - oldOps) / oldOps) * 100
      t.log(`Previous OPS: ${oldOps.toFixed(2)}`)
      t.log(`Current OPS: ${opsPerSecond.toFixed(2)}`)
      const emoji = improvement > 0 ? "🚀" : "🐌"
      t.log(`${emoji} Change: ${improvement.toFixed(2)}%`)
    } else {
      t.log('No previous benchmark to compare against.')
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
    await saveResults(newResults)
  
    t.pass()
  })