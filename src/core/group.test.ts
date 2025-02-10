import ava from 'ava'
import { groupChoices } from './group'
import type { Choice } from '../types'

ava('groupChoices - basic grouping', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    { name: 'B1', group: 'B' },
    { name: 'A2', group: 'A' },
    { name: 'C1', group: 'C' }
  ]

  const result = groupChoices(choices)

  t.is(result.length, 3)
  t.is(result[0].name, 'A')
  t.is(result[0].choices.length, 2)
  t.is(result[1].name, 'B')
  t.is(result[1].choices.length, 1)
  t.is(result[2].name, 'C')
  t.is(result[2].choices.length, 1)
})

ava('groupChoices - missing group', (t) => {
  const choices: Choice[] = [{ name: 'A1', group: 'A' }, { name: 'NoGroup' }, { name: 'B1', group: 'B' }]

  const result = groupChoices(choices)

  t.is(result.length, 3)
  t.is(result[2].name, 'No Group')
  t.is(result[2].choices.length, 1)
  t.is(result[2].choices[0].name, 'NoGroup')
})

ava('groupChoices - custom missing group name', (t) => {
  const choices: Choice[] = [{ name: 'A1', group: 'A' }, { name: 'NoGroup' }, { name: 'B1', group: 'B' }]

  const result = groupChoices(choices, {
    missingGroupName: 'Ungrouped'
  })

  t.is(result.length, 3)
  t.is(result[2].name, 'Ungrouped')
  t.is(result[2].choices.length, 1)
  t.is(result[2].choices[0].name, 'NoGroup')
})

ava('groupChoices - order', (t) => {
  const choices: Choice[] = [
    { name: 'B1', group: 'B' },
    { name: 'A1', group: 'A' },
    { name: 'C1', group: 'C' }
  ]

  const result = groupChoices(choices, {
    order: ['C', 'A', 'B']
  })

  t.is(result[0].name, 'C')
  t.is(result[1].name, 'A')
  t.is(result[2].name, 'B')
})

ava('groupChoices - endOrder', (t) => {
  const choices: Choice[] = [
    { name: 'B1', group: 'B' },
    { name: 'A1', group: 'A' },
    { name: 'C1', group: 'C' },
    { name: 'D1', group: 'D' }
  ]

  const result = groupChoices(choices, {
    endOrder: ['C', 'D']
  })

  console.log({ result })

  t.is(result[0].name, 'A')
  t.is(result[1].name, 'B')
  t.is(result[2].name, 'D')
  t.is(result[3].name, 'C')
})

ava('groupChoices - order and endOrder combined', (t) => {
  const choices: Choice[] = [
    { name: 'B1', group: 'B' },
    { name: 'A1', group: 'A' },
    { name: 'C1', group: 'C' },
    { name: 'D1', group: 'D' },
    { name: 'E1', group: 'E' }
  ]

  const result = groupChoices(choices, {
    order: ['A', 'B'],
    endOrder: ['D', 'E']
  })

  t.is(result[0].name, 'A')
  t.is(result[1].name, 'B')
  t.is(result[2].name, 'C')
  t.is(result[3].name, 'E')
  t.is(result[4].name, 'D')
})

ava('groupChoices - sortChoicesKey', (t) => {
  const choices: Choice[] = [
    { name: 'A2', group: 'A', value: 2 },
    { name: 'A1', group: 'A', value: 1 },
    { name: 'B1', group: 'B', value: 1 }
  ]

  const result = groupChoices(choices, {
    sortChoicesKey: ['value']
  })

  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'A2')
})

ava('groupChoices - recentKey and recentLimit', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A', lastUsed: 3 },
    { name: 'A2', group: 'A', lastUsed: 1 },
    { name: 'B1', group: 'B', lastUsed: 2 },
    { name: 'C1', group: 'C' }
  ] as Choice[]

  const result = groupChoices(choices, {
    recentKey: 'lastUsed',
    recentLimit: 2
  })

  t.is(result[0].name, 'Recent')
  t.is(result[0].choices.length, 2)
  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'B1')
})

ava("groupChoices - don't add Favorite group to recent", (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'Favorite', lastUsed: 3 },
    { name: 'A2', group: 'A', lastUsed: 1 },
    { name: 'B1', group: 'B', lastUsed: 2 },
    { name: 'C1', group: 'C' }
  ] as Choice[]

  const result = groupChoices(choices, {
    recentKey: 'lastUsed',
    recentLimit: 2
  })

  t.is(result[0].name, 'Recent')
  t.is(result[0].choices.length, 2)
  t.is(result[0].choices[0].name, 'B1')
  t.is(result[0].choices[1].name, 'A2')
})

ava('groupChoices - hideWithoutInput', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    { name: 'B1', group: 'B' },
    { name: 'C1', group: 'C' }
  ]

  const result = groupChoices(choices, {
    hideWithoutInput: ['B']
  })

  t.true(result[1].hideWithoutInput)
  t.falsy(result[0].hideWithoutInput)
  t.falsy(result[2].hideWithoutInput)
})

ava('groupChoices - excludeGroups', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    { name: 'B1', group: 'B' },
    { name: 'C1', group: 'C' }
  ]

  const result = groupChoices(choices, {
    excludeGroups: ['B']
  })

  t.is(result[1].choices[0].exclude, true)
  t.is(result[0].choices[0].exclude, undefined)
  t.is(result[2].choices[0].exclude, undefined)
})

ava('groupChoices - pass group', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    { name: 'Pass1', pass: true },
    { name: 'B1', group: 'B' }
  ]

  const result = groupChoices(choices)

  t.is(result[result.length - 1].name, 'Pass "{input}" to...')
  t.is(result[result.length - 1].choices.length, 1)
  t.is(result[result.length - 1].choices[0].name, 'Pass1')
})

ava('groupChoices - tagger function', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    { name: 'B1', group: 'B' }
  ]

  const tagger = (choice: Choice) => {
    ;(choice as any).tagged = true
  }

  const result = groupChoices(choices, { tagger })

  t.true((result[0].choices[0] as any).tagged)
  t.true((result[1].choices[0] as any).tagged)
})

ava('groupChoices - preview handling', (t) => {
  const choices: Choice[] = [
    {
      name: 'A1',
      group: 'A',
      preview: '<div>Preview A1</div>'
    },
    { name: 'A2', group: 'A' },
    {
      name: 'B1',
      group: 'B',
      preview: '<div>Preview B1</div>'
    }
  ]

  const result = groupChoices(choices)

  t.is(result[0].preview, '<div>Preview A1</div>')
  t.true(result[0].hasPreview)
  t.is(result[1].preview, '<div>Preview B1</div>')
  t.true(result[1].hasPreview)
})

ava('groupChoices - userGrouped sorting', (t) => {
  const choices: Choice[] = [{ name: 'A1', group: 'A' }, { name: 'B1' }, { name: 'C1', group: 'C' }]

  const result = groupChoices(choices)

  t.is(result[0].name, 'A')
  t.is(result[1].name, 'C')
  t.is(result[2].name, 'No Group')
})

ava('groupChoices - empty input', (t) => {
  const result = groupChoices([])

  t.is(result.length, 0)
})

ava('groupChoices - case insensitive ordering', (t) => {
  const choices: Choice[] = [
    { name: 'b1', group: 'b' },
    { name: 'A1', group: 'A' },
    { name: 'c1', group: 'c' }
  ]

  const result = groupChoices(choices, {
    order: ['a', 'B', 'C']
  })

  t.is(result[0].name, 'A')
  t.is(result[1].name, 'b')
  t.is(result[2].name, 'c')
})

ava('groupChoices - multiple sortChoicesKey', (t) => {
  const choices: Choice[] = [
    { name: 'A2', group: 'A', value: 2, secondaryValue: 1 },
    { name: 'A1', group: 'A', value: 1, secondaryValue: 2 },
    { name: 'B1', group: 'B', value: 1, secondaryValue: 1 }
  ] as any[]

  const result = groupChoices(choices, {
    sortChoicesKey: ['value', 'secondaryValue']
  })

  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'A2')
})

ava('groupChoices - custom groupKey', (t) => {
  const choices: Choice[] = [
    { name: 'A1', customGroup: 'A' },
    { name: 'B1', customGroup: 'B' },
    { name: 'C1', customGroup: 'C' }
  ] as any[]

  const result = groupChoices(choices, {
    groupKey: 'customGroup'
  })

  t.is(result.length, 3)
  t.is(result[0].name, 'A')
  t.is(result[1].name, 'B')
  t.is(result[2].name, 'C')
})

ava('groupChoices - recent choices with custom recent flag', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A', lastUsed: 3, recent: true },
    {
      name: 'A2',
      group: 'A',
      lastUsed: 1,
      recent: false
    },
    { name: 'B1', group: 'B', lastUsed: 2 },
    { name: 'C1', group: 'C' }
  ] as Choice[]

  const result = groupChoices(choices, {
    recentKey: 'lastUsed',
    recentLimit: 2
  })

  t.is(result[0].name, 'Recent')
  t.is(result[0].choices.length, 2)
  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'B1')
})

ava('groupChoices - pass group with previewPath', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A' },
    {
      name: 'Pass1',
      pass: true,
      previewPath: 'path/to/preview'
    },
    { name: 'B1', group: 'B' }
  ]

  const result = groupChoices(choices)

  t.is(result[result.length - 1].name, 'Pass "{input}" to...')
  t.is(result[result.length - 1].choices.length, 1)
  t.is(result[result.length - 1].choices[0].name, 'Pass1')
  t.is(result[result.length - 1].choices[0].previewPath, 'path/to/preview')
  t.is(result[result.length - 1].choices[0].preview, undefined)
})

ava('groupChoices - benchmark performance', (t) => {
  const createChoices = (iterations: number): Choice[] => {
    return Array.from({ length: iterations }, (_, i) => ({
      name: `Choice${i + 1}`,
      group: `Group${Math.floor(i / 3) + 1}`,
      value: Math.random()
    }))
  }

  const benchmarkGroupChoices = () => {
    const iterations = 1000
    const choices = createChoices(iterations)
    const startTime = process.hrtime()

    for (let i = 0; i < iterations; i++) {
      groupChoices(choices, { sortChoicesKey: ['value'] })
    }

    const [seconds, nanoseconds] = process.hrtime(startTime)
    const totalTimeMs = seconds * 1000 + nanoseconds / 1e6
    const averageTimeMs = totalTimeMs / iterations

    return averageTimeMs
  }

  const averageTime = benchmarkGroupChoices()
  t.log(`Average time per groupChoices call with 1000 choices: ${averageTime.toFixed(3)} ms`)
  t.pass()
})

ava('groupChoices - respects choice index within group', (t) => {
  const choices: Choice[] = [
    { name: 'A2', group: 'A', index: 2 },
    { name: 'A1', group: 'A', index: 1 },
    { name: 'A3', group: 'A', index: 3 },
    { name: 'A0', group: 'A', index: 0 }
  ]

  const result = groupChoices(choices)

  t.is(result[0].choices[0].name, 'A0')
  t.is(result[0].choices[1].name, 'A1')
  t.is(result[0].choices[2].name, 'A2')
  t.is(result[0].choices[3].name, 'A3')
})

ava('groupChoices - index works with other sorting options', (t) => {
  const choices: Choice[] = [
    { name: 'A2', group: 'A', index: 1, value: 2 },
    { name: 'A1', group: 'A', index: 0, value: 1 },
    { name: 'B1', group: 'B', index: 0 }
  ]

  const result = groupChoices(choices, {
    sortChoicesKey: ['value']
  })

  // Index should take precedence over value sorting
  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'A2')
})

ava('groupChoices - mixed indexed and non-indexed choices', (t) => {
  const choices: Choice[] = [
    { name: 'A3', group: 'A' }, // No index
    { name: 'A1', group: 'A', index: 0 },
    { name: 'A4', group: 'A' }, // No index
    { name: 'A2', group: 'A', index: 1 }
  ]

  const result = groupChoices(choices)

  // Indexed items should come first, in order
  t.is(result[0].choices[0].name, 'A1')
  t.is(result[0].choices[1].name, 'A2')
  // Non-indexed items should follow, in original order
  t.is(result[0].choices[2].name, 'A3')
  t.is(result[0].choices[3].name, 'A4')
})

// Test using kenv as the group key with timestamps, order, and endOrder
ava('groupChoices - using kenv as groupKey with timestamps and order options', (t) => {
  const scripts = [
    // These scripts have timestamps and will be captured by the recent group (if room permits)
    { name: 'ScriptKit1', kenv: 'Kit', timestamp: 150 },
    { name: 'ScriptScriptlets1', kenv: 'Scriptlets', timestamp: 100 },
    { name: 'ScriptMain1', timestamp: 50 }, // no kenv → missing group ("Main")
    // This one should not go to recent because its group is "Favorite"
    { name: 'ScriptFavorite', kenv: 'Favorite', timestamp: 200 },
    // These will fall into their respective groups because recent is already full
    { name: 'ScriptApps', kenv: 'Apps', timestamp: 120 },
    // A pass script is handled separately
    { name: 'ScriptPass', pass: true, kenv: 'Anything', timestamp: 80 },
    // Additional scripts that don't qualify for recent because the limit is reached
    { name: 'ScriptKit2', kenv: 'Kit', timestamp: 180 },
    { name: 'ScriptScriptlets2', kenv: 'Scriptlets', timestamp: 90 }
  ]

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Favorite', 'Main', 'Scriptlets', 'Kit'],
    endOrder: ['Apps', 'Pass'],
    recentKey: 'timestamp',
    recentLimit: 3, // limit the recent group to 3 items for testing
    hideWithoutInput: [],
    tagger: null,
    excludeGroups: []
  }

  const result = groupChoices(scripts, options)

  // Expect a recent group as the first group containing the first three eligible (non-Favorite) items:
  t.is(result[0].name, 'Recent')
  t.is(result[0].choices.length, 3)
  // They should be sorted descending by timestamp (highest first):
  t.deepEqual(
    result[0].choices.map((c) => (c as Choice).name),
    ['ScriptKit1', 'ScriptScriptlets1', 'ScriptMain1']
  )

  // Next, the remaining groups should be sorted according to order and endOrder.
  // "Favorite" is in the order array and should come next.
  t.is(result[1].name, 'Favorite')
  t.deepEqual(
    result[1].choices.map((c: Choice) => c.name),
    ['ScriptFavorite']
  )

  // The remaining groups come from the non-recent scripts:
  // "Scriptlets" should follow:
  t.is(result[2].name.toLowerCase(), 'scriptlets')
  t.deepEqual(
    result[2].choices.map((c: Choice) => c.name),
    ['ScriptScriptlets2']
  )

  // Then "Kit":
  t.is(result[3].name.toLowerCase(), 'kit')
  t.deepEqual(
    result[3].choices.map((c: Choice) => c.name),
    ['ScriptKit2']
  )

  // "Apps" is defined in endOrder and should appear after the ordered groups:
  t.is(result[4].name.toLowerCase(), 'apps')
  t.deepEqual(
    result[4].choices.map((c: Choice) => c.name),
    ['ScriptApps']
  )

  // Finally, the pass group is always appended at the end:
  t.is(result[5].name, 'Pass "{input}" to...')
  t.deepEqual(
    result[5].choices.map((c: Choice) => c.name),
    ['ScriptPass']
  )

  t.pass()
})

// Test that scripts without a timestamp are not added to the recent group
ava('groupChoices - scripts without timestamps do not appear in recent group', (t) => {
  const scripts = [
    { name: 'Script1', kenv: 'Kit' },
    { name: 'Script2', kenv: 'Main' },
    { name: 'Script3', kenv: 'Scriptlets', timestamp: 100 },
    { name: 'Script4', kenv: 'Favorite', timestamp: 200 }
  ]

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Favorite', 'Main', 'Scriptlets', 'Kit'],
    endOrder: ['Apps', 'Pass'],
    recentKey: 'timestamp',
    recentLimit: 2,
    hideWithoutInput: [],
    tagger: null,
    excludeGroups: []
  }

  const result = groupChoices(scripts, options)

  // Only Script3 qualifies for recent (Script1 and Script2 have no timestamp; Script4 is in "Favorite")
  t.is(result[0].name, 'Recent')
  t.deepEqual(
    result[0].choices.map((c: Choice) => c.name),
    ['Script3']
  )

  // Verify the remaining groups appear in order:
  t.is(result[1].name, 'Favorite')
  t.deepEqual(
    result[1].choices.map((c: Choice) => c.name),
    ['Script4']
  )
  t.is(result[2].name, 'Main')
  t.deepEqual(
    result[2].choices.map((c: Choice) => c.name),
    ['Script2']
  )
  t.is(result[3].name.toLowerCase(), 'kit')
  t.deepEqual(
    result[3].choices.map((c: Choice) => c.name),
    ['Script1']
  )

  t.pass()
})

// Test that the excludeGroups option marks choices with the matching kenv as excluded
ava('groupChoices - using excludeGroups with kenv', (t) => {
  const scripts = [
    // These have timestamps and will normally be eligible for recent,
    // but we also add a second batch without timestamps so they get grouped.
    { name: 'Script1', kenv: 'Kit', timestamp: 50 },
    { name: 'Script2', kenv: 'Scriptlets', timestamp: 60 },
    { name: 'Script3', kenv: 'Scriptlets', timestamp: 70 },
    { name: 'Script4', kenv: 'Main', timestamp: 80 }
  ]

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Favorite', 'Main', 'Scriptlets', 'Kit'],
    endOrder: ['Apps', 'Pass'],
    recentKey: 'timestamp',
    recentLimit: 10, // use a high limit so that later scripts fall through to groups
    hideWithoutInput: [],
    tagger: null,
    excludeGroups: ['Scriptlets']
  }

  // First, run with all scripts having a timestamp.
  const result = groupChoices(scripts, options)

  // The two Scriptlets items will be eligible for recent since they have timestamps.
  // Now run a second test batch where the scripts do NOT have timestamps so that they fall into groups.
  const scripts2 = [
    { name: 'Script5', kenv: 'Kit' },
    { name: 'Script6', kenv: 'Scriptlets' },
    { name: 'Script7', kenv: 'Main' }
  ]
  const result2 = groupChoices(scripts2, options)

  // In result2, the group for "Scriptlets" should exist and its choices should be marked as excluded.
  const scriptletsGroup = result2.find((g) => g.name === 'Scriptlets')
  t.truthy(scriptletsGroup)
  t.true(scriptletsGroup!.choices.every((c) => (c as Choice).exclude === true))

  // For other groups (like "Kit"), the choices should not be marked as excluded.
  const kitGroup = result2.find((g) => g.name === 'Kit')
  t.truthy(kitGroup)
  t.true(kitGroup!.choices.every((c) => !(c as Choice).exclude))

  t.pass()
})

// Test using hideWithoutInput with kenv
ava('groupChoices - using hideWithoutInput with kenv', (t) => {
  const scripts = [
    { name: 'Script1', kenv: 'Kit' },
    { name: 'Script2', kenv: 'Main' }
  ]

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Main', 'Kit'],
    endOrder: [],
    recentKey: '',
    recentLimit: 10,
    hideWithoutInput: ['Kit'],
    tagger: null,
    excludeGroups: []
  }

  const result = groupChoices(scripts, options)
  // The "Kit" group should have hideWithoutInput set to true.
  const kitGroup = result.find((g) => g.name === 'Kit')
  t.truthy(kitGroup)
  t.true(kitGroup!.hideWithoutInput)
  // The "Main" group should not be hidden.
  const mainGroup = result.find((g) => g.name === 'Main')
  t.truthy(mainGroup)
  t.falsy(mainGroup!.hideWithoutInput)

  t.pass()
})

// Test ordering when combining order and endOrder with kenv
ava('groupChoices - ordering with order and endOrder using kenv', (t) => {
  const scripts = [
    { name: 'ScriptA', kenv: 'Kit' },
    { name: 'ScriptB', kenv: 'Scriptlets' },
    { name: 'ScriptC', kenv: 'Main' },
    { name: 'ScriptD', kenv: 'Apps' } // should be moved to the end per endOrder
  ]

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Main', 'Scriptlets', 'Kit'],
    endOrder: ['Apps', 'Pass'],
    recentKey: '',
    recentLimit: 10,
    hideWithoutInput: [],
    tagger: null,
    excludeGroups: []
  }

  const result = groupChoices(scripts, options)
  // Expect groups in the following order:
  // - No recent group (since recentKey is blank)
  // - Groups from the order array: "Main", "Scriptlets", "Kit"
  // - Followed by groups from the endOrder: "Apps"
  t.deepEqual(
    result.map((g) => g.name),
    ['Main', 'Scriptlets', 'Kit', 'Apps']
  )
  t.pass()
})

// Test that a custom tagger function is applied to each script (using kenv)
ava('groupChoices - using tagger with kenv', (t) => {
  const scripts = [
    { name: 'Script1', kenv: 'Kit' },
    { name: 'Script2', kenv: 'Main' }
  ]
  const tagger = (choice: any) => {
    choice.tagged = true
  }

  const options = {
    groupKey: 'kenv',
    missingGroupName: 'Main',
    order: ['Main', 'Kit'],
    endOrder: [],
    recentKey: '',
    recentLimit: 10,
    hideWithoutInput: [],
    tagger,
    excludeGroups: []
  }

  const result = groupChoices(scripts, options)

  // Verify that each choice in every group was tagged by our tagger.
  result.forEach((group) => {
    group.choices.forEach((choice) => {
      t.true((choice as any).tagged)
    })
  })
  t.pass()
})

ava('groupChoices - exclude:true items are not added to recent group', (t) => {
  const choices: Choice[] = [
    { name: 'A1', group: 'A', lastUsed: 3 },
    { name: 'A2', group: 'A', lastUsed: 1, exclude: true },
    { name: 'B1', group: 'B', lastUsed: 2 },
    { name: 'C1', group: 'C', lastUsed: 4, exclude: true },
    { name: 'D1', group: 'D', lastUsed: 5 }
  ] as (Choice & { lastUsed: number })[]

  const result = groupChoices(choices, {
    recentKey: 'lastUsed',
    recentLimit: 3
  })

  // Recent group should only contain non-excluded items
  t.is(result[0].name, 'Recent')
  t.is(result[0].choices.length, 3)
  t.deepEqual(
    result[0].choices.map((c: Choice) => c.name),
    ['D1', 'A1', 'B1']
  )

  // Verify excluded items still appear in their regular groups
  const groupA = result.find(g => g.name === 'A')
  t.truthy(groupA)
  t.true(groupA!.choices.some((c: Choice) => c.name === 'A2' && c.exclude === true))

  const groupC = result.find(g => g.name === 'C')
  t.truthy(groupC)
  t.true(groupC!.choices.some((c: Choice) => c.name === 'C1' && c.exclude === true))
})
