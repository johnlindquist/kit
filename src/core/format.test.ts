import ava from "ava"
import { formatChoices, defaultGroupClassName, defaultGroupNameClassName } from "./format"
import { PROMPT } from "./enum.js"
import type { Choice } from "../types"

ava("formatChoices - basic primitive choices", (t) => {
    const choices = ["option1", "option2", "option3"] as unknown as Choice[]
    const result = formatChoices(choices)

    t.is(result.length, 3)
    t.is(result[0].name, "option1")
    t.is(result[0].value, "option1")
    t.is(result[0].id, "0-option1")
    t.false(result[0].hasPreview)
})

ava("formatChoices - object choices", (t) => {
    const choices = [{
        name: "Test Choice",
        value: "test",
        description: "A test choice",
        hasPreview: true
    }] as Choice[]
    
    const result = formatChoices(choices)

    t.is(result.length, 1)
    t.is(result[0].name, "Test Choice")
    t.is(result[0].value, "test")
    t.is(result[0].description?.slice(0, 63), "A test choice")
    t.true(result[0].hasPreview)
})

ava("formatChoices - grouped choices", (t) => {
    const choices = [{
        name: "Group 1",
        choices: ["subOption1", "subOption2"]
    }] as Choice[]

    const result = formatChoices(choices)

    t.is(result.length, 3) // 1 group + 2 options
    t.is(result[0].name, "Group 1")
    t.is(result[0].className, defaultGroupClassName)
    t.is(result[0].nameClassName, defaultGroupNameClassName)
    t.true(result[0].skip)
    
    t.is(result[1].name, "subOption1")
    t.is(result[1].group, "Group 1")
    t.is(result[2].name, "subOption2")
    t.is(result[2].group, "Group 1")
})

ava("formatChoices - name slicing", (t) => {
    const longName = "a".repeat(100)
    const choices = [longName] as unknown as Choice[]
    
    const result = formatChoices(choices)

    t.is(result[0].name?.slice(0, 63).length, 63)
    t.is(result[0].name, longName)
})

ava("formatChoices - custom className", (t) => {
    const customClass = "custom-class"
    const choices = ["option1"] as unknown as Choice[]
    
    const result = formatChoices(choices, customClass)

    t.is(result[0].className, customClass)
})

ava("formatChoices - info choices", (t) => {
    const choices = [{
        name: "Info Item",
        info: true,
        value: "info"
    }] as Choice[]
    
    const result = formatChoices(choices)

    t.is(result[0].nameClassName, "text-primary")
    t.true(result[0].skip)
})

ava("formatChoices - height constraints", (t) => {
    const choices = [{
        name: "Tall Item",
        height: 1000 // Very tall
    }, {
        name: "Short Item",
        height: 1 // Very short
    }] as Choice[]
    
    const result = formatChoices(choices)

    t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL) // Using enum value instead of hardcoded number
    t.is(result[1].height, PROMPT.ITEM.HEIGHT.XXXS)
})

ava("formatChoices - invalid input handling", (t) => {
    t.throws(() => formatChoices("not an array" as any), {
        message: "Choices must be an array. Received string"
    })

    t.throws(() => formatChoices([{
        name: "Group",
        choices: "not an array"
    }] as any), {
        message: "Group choices must be an array."
    })

    t.throws(() => formatChoices([{
        name: "Group",
        choices: [undefined]
    }] as any), {
        message: "Undefined choice in Group"
    })
})

ava("formatChoices - mixed primitive and object choices", (t) => {
    const choices = [
        "simple",
        { name: "Complex", value: "complex", description: "A complex choice" }
    ] as Choice[]
    
    const result = formatChoices(choices)

    t.is(result.length, 2)
    t.is(result[0].name, "simple")
    t.is(result[0].value, "simple")
    t.is(result[1].name, "Complex")
    t.is(result[1].description?.slice(0, 63), "A complex choice")
})

ava("formatChoices - nested group structure", (t) => {
    const choices = [{
        name: "Parent Group",
        choices: [
            "option1",
            { 
                name: "Complex Option", 
                value: "complex",
                description: "A nested option" 
            }
        ]
    }] as unknown as Choice[]

    const result = formatChoices(choices)

    t.is(result.length, 3) // Parent group + 2 options
    t.is(result[0].name, "Parent Group")
    t.true(result[0].skip)
    t.is(result[1].name, "option1")
    t.is(result[1].group, "Parent Group")
    t.is(result[2].name, "Complex Option")
    t.is(result[2].group, "Parent Group")
})

ava("formatChoices - multiple groups at same level", (t) => {
    const choices = [
        {
            name: "Group 1",
            choices: ["option1", "option2"]
        },
        {
            name: "Group 2",
            choices: ["option3", "option4"]
        }
    ] as unknown as Choice[]

    const result = formatChoices(choices)

    t.is(result.length, 6) // 2 groups + 4 options
    t.is(result[0].name, "Group 1")
    t.is(result[1].name, "option1")
    t.is(result[1].group, "Group 1")
    t.is(result[2].name, "option2")
    t.is(result[2].group, "Group 1")
    t.is(result[3].name, "Group 2")
    t.is(result[4].name, "option3")
    t.is(result[4].group, "Group 2")
    t.is(result[5].name, "option4")
    t.is(result[5].group, "Group 2")
})

ava("formatChoices - empty groups handling", (t) => {
    const choices = [{
        name: "Empty Group",
        choices: []
    }] as Choice[]

    const result = formatChoices(choices)

    t.is(result.length, 1)
    t.is(result[0].name, "Empty Group")
    t.true(result[0].skip)
})

ava("formatChoices - multiple class names", (t) => {
    const choices = [{
        name: "Styled Item",
        className: "existing-class",
        value: "styled"
    }] as Choice[]
    
    const result = formatChoices(choices, "additional-class")

    // The item's own className should take precedence over the provided one
    t.is(result[0].className, "existing-class")
})

ava("formatChoices - id generation consistency", (t) => {
    const choices = [
        { name: "Item 1", value: "value1" },
        { name: "Item 1", value: "value1" }, // Duplicate item
        { id: "custom-id", name: "Item 2", value: "value2" }
    ] as Choice[]
    
    const result = formatChoices(choices)

    t.is(result[0].id, "0-Item 1")
    t.is(result[1].id, "1-Item 1") // Should have different id despite same name
    t.is(result[2].id, "custom-id") // Should preserve custom id
})

ava("formatChoices - respects index property for ordering", (t) => {
    const choices = [
        {
            name: "Group 1",
            choices: [
                { name: "Third", value: "c", index: 2 },
                { name: "First", value: "a", index: 0 },
                { name: "Second", value: "b", index: 1 }
            ]
        },
        {
            name: "Group 2",
            choices: [
                { name: "Z", value: "z", index: 5 },
                { name: "X", value: "x", index: 0 },
                { name: "Y", value: "y", index: 2 }
            ]
        }
    ] as unknown as Choice[]

    const result = formatChoices(choices)

    // Check Group 1 ordering
    t.is(result[1].name, "First")
    t.is(result[1].group, "Group 1")
    t.is(result[2].name, "Second")
    t.is(result[2].group, "Group 1")
    t.is(result[3].name, "Third")
    t.is(result[3].group, "Group 1")

    // Check Group 2 ordering
    t.is(result[5].name, "X")
    t.is(result[5].group, "Group 2")
    t.is(result[6].name, "Y")
    t.is(result[6].group, "Group 2")
    t.is(result[7].name, "Z")
    t.is(result[7].group, "Group 2")

    // Verify the indexes were preserved
    t.is(result[1].index, 0)
    t.is(result[2].index, 1)
    t.is(result[3].index, 2)
    t.is(result[5].index, 0)
    t.is(result[6].index, 2)
    t.is(result[7].index, 5)
})

ava("formatChoices - index property determines position in results", (t) => {
    const choices = [
        { name: "Default 1" },
        { name: "Default 2" },
        { name: "First", index: 0 },
        { name: "Last", index: 999 },
        { name: "Middle", index: 2 },
        { name: "Default 3" }
    ] as Choice[]

    const result = formatChoices(choices)

    // Items with index should be positioned accordingly
    t.is(result[0].name, "First", "index:0 should be first")
    t.is(result[2].name, "Middle", "index:2 should be third")
    t.is(result[result.length - 1].name, "Last", "index:999 should be last")

    // Default items should maintain relative order between indexed items
    const defaultItems = result.filter(item => item.index === undefined)
    t.deepEqual(
        defaultItems.map(item => item.name),
        ["Default 1", "Default 2", "Default 3"],
        "Non-indexed items should maintain their relative order"
    )
})

ava("formatChoices - index property determines position within groups", (t) => {
    const choices = [{
        name: "Group",
        choices: [
            { name: "Middle", index: 1 },
            { name: "First", index: 0 },
            { name: "Default 1" },
            { name: "Last", index: 5 },
            { name: "Default 2" }
        ]
    }] as unknown as Choice[]

    const result = formatChoices(choices)
    // Skip first result as it's the group header
    const groupItems = result.slice(1)

    t.is(groupItems[0].name, "First", "index:0 should be first in group")
    t.is(groupItems[1].name, "Middle", "index:1 should be second in group")
    t.is(groupItems[4].name, "Last", "index:5 should be last in group")

    // Check that non-indexed items maintain their order between indexed items
    const defaultItems = groupItems.filter(item => item.index === undefined)
    t.deepEqual(
        defaultItems.map(item => item.name),
        ["Default 1", "Default 2"],
        "Non-indexed items should maintain their relative order"
    )
})


import test from 'ava'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import path from 'node:path'
import os from 'node:os'

function loadPreviousResults(filename = path.resolve(os.homedir(), '.benchmark-results.json')) {
  if (!existsSync(filename)) return {}
  return JSON.parse(readFileSync(filename, 'utf8'))
}

function saveResults(results, filename = path.resolve(os.homedir(), '.benchmark-results.json')) {
  writeFileSync(filename, JSON.stringify(results, null, 2), 'utf8')
}

test.serial('benchmark - formatChoices', (t) => {
  const previousResults = loadPreviousResults()

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
    t.log(`Change: ${improvement.toFixed(2)}%`)
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
  saveResults(newResults)

  t.pass()
})
