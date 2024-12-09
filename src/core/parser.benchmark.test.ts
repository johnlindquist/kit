import ava from "ava"
import { parseScript } from "./parser"
import { loadPreviousResults, saveResults } from "./test-utils"
import tmp from 'tmp-promise'

ava.only('benchmark - parseScript', async (t) => {
	await tmp.withDir(async (dir) => {
	const previousResults = await loadPreviousResults()

	const scriptContents = `
// Name: Concat Kenv Examples into a Single File
// Description: Join all of Kenv Examples Scripts

import "@johnlindquist/kit"
import { globby } from "globby"

let all = await globby(home("dev", "kit-examples-ts", "scripts", "**", "*.ts"))
// split into 5 arrays of equal length
let arrayLength = Math.ceil(all.length / 5)
let arrays = []
for (let i = 0; i < all.length; i += arrayLength) {
arrays.push(all.slice(i, i + arrayLength))
}

let allKitPath = kenvPath("all-kenv-examples.txt")
await writeFile(allKitPath, "")

for await (let array of arrays) {  
for await (let filePath of array) {
let contents = await readFile(filePath, "utf8")
await appendFile(allKitPath, contents)
}
}

await revealFile(allKitPath)        
	`

	const scriptPath = path.join(dir.path, "script.ts")
	await writeFile(scriptPath, scriptContents)
  
  
	// Run the benchmark multiple times to get stable measurements
	const runs = 1000
	const times = []

  
	for (let i = 0; i < runs; i++) {
	  const start = performance.now()
	  await parseScript(scriptPath)
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
  }, {
	unsafeCleanup: true
  })
})