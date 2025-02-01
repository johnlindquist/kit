import ava from 'ava'
import { formatChoices, defaultGroupClassName, defaultGroupNameClassName } from './format'
import { PROMPT } from './enum.js'
import type { Choice } from '../types'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import tmp from 'tmp-promise'
import { parseScript } from './parser.js'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadPreviousResults, saveResults } from './test-utils'

ava('formatChoices - basic primitive choices', (t) => {
  const choices = ['option1', 'option2', 'option3'] as unknown as Choice[]
  const result = formatChoices(choices)

  t.is(result.length, 3)
  t.is(result[0].name, 'option1')
  t.is(result[0].value, 'option1')
  t.is(result[0].id, '0-option1')
  t.false(result[0].hasPreview)
})

ava('formatChoices - object choices', (t) => {
  const choices = [
    {
      name: 'Test Choice',
      value: 'test',
      description: 'A test choice',
      hasPreview: true
    }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 1)
  t.is(result[0].name, 'Test Choice')
  t.is(result[0].value, 'test')
  t.is(result[0].description?.slice(0, 63), 'A test choice')
  t.true(result[0].hasPreview)
})

ava('formatChoices - grouped choices', (t) => {
  const choices = [
    {
      name: 'Group 1',
      choices: ['subOption1', 'subOption2']
    }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 3) // 1 group + 2 options
  t.is(result[0].name, 'Group 1')
  t.is(result[0].className, defaultGroupClassName)
  t.is(result[0].nameClassName, defaultGroupNameClassName)
  t.true(result[0].skip)

  t.is(result[1].name, 'subOption1')
  t.is(result[1].group, 'Group 1')
  t.is(result[2].name, 'subOption2')
  t.is(result[2].group, 'Group 1')
})

ava('formatChoices - name slicing', (t) => {
  const longName = 'a'.repeat(100)
  const choices = [longName] as unknown as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].name?.slice(0, 63).length, 63)
  t.is(result[0].name, longName)
})

ava('formatChoices - custom className', (t) => {
  const customClass = 'custom-class'
  const choices = ['option1'] as unknown as Choice[]

  const result = formatChoices(choices, customClass)

  t.is(result[0].className, customClass)
})

ava('formatChoices - info choices', (t) => {
  const choices = [
    {
      name: 'Info Item',
      info: true,
      value: 'info'
    }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].nameClassName, 'text-primary')
  t.true(result[0].skip)
})

ava('formatChoices - height constraints', (t) => {
  const choices = [
    {
      name: 'Tall Item',
      height: 1000 // Very tall
    },
    {
      name: 'Short Item',
      height: 1 // Very short
    }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL) // Using enum value instead of hardcoded number
  t.is(result[1].height, PROMPT.ITEM.HEIGHT.XXXS)
})

ava('formatChoices - invalid input handling', (t) => {
  t.throws(() => formatChoices('not an array' as any), {
    message: 'Choices must be an array. Received string'
  })

  t.throws(
    () =>
      formatChoices([
        {
          name: 'Group',
          choices: 'not an array'
        }
      ] as any),
    {
      message: 'Group choices must be an array.'
    }
  )

  t.throws(
    () =>
      formatChoices([
        {
          name: 'Group',
          choices: [undefined]
        }
      ] as any),
    {
      message: 'Undefined choice in Group'
    }
  )
})

ava('formatChoices - mixed primitive and object choices', (t) => {
  const choices = ['simple', { name: 'Complex', value: 'complex', description: 'A complex choice' }] as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 2)
  t.is(result[0].name, 'simple')
  t.is(result[0].value, 'simple')
  t.is(result[1].name, 'Complex')
  t.is(result[1].description?.slice(0, 63), 'A complex choice')
})

ava('formatChoices - nested group structure', (t) => {
  const choices = [
    {
      name: 'Parent Group',
      choices: [
        'option1',
        {
          name: 'Complex Option',
          value: 'complex',
          description: 'A nested option'
        }
      ]
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 3) // Parent group + 2 options
  t.is(result[0].name, 'Parent Group')
  t.true(result[0].skip)
  t.is(result[1].name, 'option1')
  t.is(result[1].group, 'Parent Group')
  t.is(result[2].name, 'Complex Option')
  t.is(result[2].group, 'Parent Group')
})

ava('formatChoices - multiple groups at same level', (t) => {
  const choices = [
    {
      name: 'Group 1',
      choices: ['option1', 'option2']
    },
    {
      name: 'Group 2',
      choices: ['option3', 'option4']
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 6) // 2 groups + 4 options
  t.is(result[0].name, 'Group 1')
  t.is(result[1].name, 'option1')
  t.is(result[1].group, 'Group 1')
  t.is(result[2].name, 'option2')
  t.is(result[2].group, 'Group 1')
  t.is(result[3].name, 'Group 2')
  t.is(result[4].name, 'option3')
  t.is(result[4].group, 'Group 2')
  t.is(result[5].name, 'option4')
  t.is(result[5].group, 'Group 2')
})

ava('formatChoices - empty groups handling', (t) => {
  const choices = [
    {
      name: 'Empty Group',
      choices: []
    }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result.length, 1)
  t.is(result[0].name, 'Empty Group')
  t.true(result[0].skip)
})

ava('formatChoices - multiple class names', (t) => {
  const choices = [
    {
      name: 'Styled Item',
      className: 'existing-class',
      value: 'styled'
    }
  ] as Choice[]

  const result = formatChoices(choices, 'additional-class')

  // The item's own className should take precedence over the provided one
  t.is(result[0].className, 'existing-class')
})

ava('formatChoices - id generation consistency', (t) => {
  const choices = [
    { name: 'Item 1', value: 'value1' },
    { name: 'Item 1', value: 'value1' }, // Duplicate item
    { id: 'custom-id', name: 'Item 2', value: 'value2' }
  ] as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].id, '0-Item 1')
  t.is(result[1].id, '1-Item 1') // Should have different id despite same name
  t.is(result[2].id, 'custom-id') // Should preserve custom id
})

ava('formatChoices - respects index property for ordering', (t) => {
  const choices = [
    {
      name: 'Group 1',
      choices: [
        { name: 'Third', value: 'c', index: 2 },
        { name: 'First', value: 'a', index: 0 },
        { name: 'Second', value: 'b', index: 1 }
      ]
    },
    {
      name: 'Group 2',
      choices: [
        { name: 'Z', value: 'z', index: 5 },
        { name: 'X', value: 'x', index: 0 },
        { name: 'Y', value: 'y', index: 2 }
      ]
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  // Check Group 1 ordering
  t.is(result[1].name, 'First')
  t.is(result[1].group, 'Group 1')
  t.is(result[2].name, 'Second')
  t.is(result[2].group, 'Group 1')
  t.is(result[3].name, 'Third')
  t.is(result[3].group, 'Group 1')

  // Check Group 2 ordering
  t.is(result[5].name, 'X')
  t.is(result[5].group, 'Group 2')
  t.is(result[6].name, 'Y')
  t.is(result[6].group, 'Group 2')
  t.is(result[7].name, 'Z')
  t.is(result[7].group, 'Group 2')

  // Verify the indexes were preserved
  t.is(result[1].index, 0)
  t.is(result[2].index, 1)
  t.is(result[3].index, 2)
  t.is(result[5].index, 0)
  t.is(result[6].index, 2)
  t.is(result[7].index, 5)
})

ava('formatChoices - index property determines position in results', (t) => {
  const choices = [
    { name: 'Default 1' },
    { name: 'Default 2' },
    { name: 'First', index: 0 },
    { name: 'Last', index: 999 },
    { name: 'Middle', index: 2 },
    { name: 'Default 3' }
  ] as Choice[]

  const result = formatChoices(choices)

  // Items with index should be positioned accordingly
  t.is(result[0].name, 'First', 'index:0 should be first')
  t.is(result[2].name, 'Middle', 'index:2 should be third')
  t.is(result[result.length - 1].name, 'Last', 'index:999 should be last')

  // Default items should maintain relative order between indexed items
  const defaultItems = result.filter((item) => item.index === undefined)
  t.deepEqual(
    defaultItems.map((item) => item.name),
    ['Default 1', 'Default 2', 'Default 3'],
    'Non-indexed items should maintain their relative order'
  )
})

ava('formatChoices - index property determines position within groups', (t) => {
  const choices = [
    {
      name: 'Group',
      choices: [
        { name: 'Middle', index: 1 },
        { name: 'First', index: 0 },
        { name: 'Default 1' },
        { name: 'Last', index: 5 },
        { name: 'Default 2' }
      ]
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)
  // Skip first result as it's the group header
  const groupItems = result.slice(1)

  t.is(groupItems[0].name, 'First', 'index:0 should be first in group')
  t.is(groupItems[1].name, 'Middle', 'index:1 should be second in group')
  t.is(groupItems[4].name, 'Last', 'index:5 should be last in group')

  // Check that non-indexed items maintain their order between indexed items
  const defaultItems = groupItems.filter((item) => item.index === undefined)
  t.deepEqual(
    defaultItems.map((item) => item.name),
    ['Default 1', 'Default 2'],
    'Non-indexed items should maintain their relative order'
  )
})

ava('formatChoices - height at exact max boundary remains unchanged', (t) => {
  const choices = [
    {
      name: 'Max Height',
      height: PROMPT.ITEM.HEIGHT.XXL
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL)
})

ava('formatChoices - height at exact min boundary remains unchanged', (t) => {
  const choices = [
    {
      name: 'Min Height',
      height: PROMPT.ITEM.HEIGHT.XXXS
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXXS)
})

ava('formatChoices - height just above max boundary is clamped to max', (t) => {
  const choices = [
    {
      name: 'Just Above Max',
      height: PROMPT.ITEM.HEIGHT.XXL + 10
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL)
})

ava('formatChoices - height just below min boundary is clamped to min', (t) => {
  const choices = [
    {
      name: 'Just Below Min',
      height: PROMPT.ITEM.HEIGHT.XXXS - 5
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXXS)
})

ava('formatChoices - no height specified on a normal item defaults to undefined', (t) => {
  // Non-grouped items do not get a default height assigned
  const choices = [
    {
      name: 'No Height Specified'
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].height, undefined)
})

// --------------------------------------------
// Additional General Tests
// --------------------------------------------

ava('formatChoices - preview property on nested choices sets hasPreview to true', (t) => {
  const choices = [
    {
      name: 'Group with Preview',
      choices: [{ name: 'Has Preview', preview: 'some preview content' }, { name: 'No Preview' }]
    }
  ] as Choice[]

  const result = formatChoices(choices)
  // result[0] is the group header
  t.true(result[1].hasPreview, 'Nested item with preview should have hasPreview = true')
  t.false(result[2].hasPreview, 'Nested item without preview should have hasPreview = false')
})

ava('formatChoices - skip logic respects info property being false', (t) => {
  const choices = [
    { name: 'No Info', value: 'no-info' },
    { name: 'False Info', info: false, value: 'false-info' }
  ] as Choice[]

  const result = formatChoices(choices)
  t.false(result[0].skip, 'Item without info should not skip by default')
  t.false(result[1].skip, 'Item with info: false should not skip')
})

ava('formatChoices - short names and descriptions are sliced safely', (t) => {
  const choices = [
    {
      name: 'Short',
      value: 'short',
      description: 'desc'
    }
  ] as Choice[]

  const result = formatChoices(choices)
  t.is(result[0].slicedName, 'Short', 'Short names remain intact')
  t.is(result[0].slicedDescription, 'desc', 'Short descriptions remain intact')
})

ava('formatChoices - empty name for a group still creates a group header', (t) => {
  const choices = [
    {
      name: '',
      choices: ['option1', 'option2']
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  // The first item is the group header with an empty name
  t.is(result[0].name, '')
  t.true(result[0].skip, 'Group headers skip by default')
  t.is(result[1].name, 'option1')
  t.is(result[1].group, '')
  t.is(result[2].name, 'option2')
  t.is(result[2].group, '')
})

ava('formatChoices - group headers default to minimum height if none provided', (t) => {
  const choices = [
    {
      name: 'Some Group',
      choices: ['option1', 'option2']
      // No height specified
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].name, 'Some Group')
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXXS, 'Group headers default to XXXS height')
  // Sub-choices shouldn't get a forced height
  t.is(result[1].height, undefined, "Non-group items don't get a forced height")
})

ava('formatChoices - group headers with an out-of-bound height are clamped', (t) => {
  const choices = [
    {
      name: 'Tall Group',
      height: PROMPT.ITEM.HEIGHT.XXL + 50, // Way too tall
      choices: [
        { name: 'Inside Group', height: PROMPT.ITEM.HEIGHT.XXXS - 10 } // Too small
      ]
    }
  ] as unknown as Choice[]

  const result = formatChoices(choices)

  t.is(result[0].name, 'Tall Group')
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL, 'Group header height is clamped to XXL')
  t.is(result[1].name, 'Inside Group')
  t.is(result[1].height, PROMPT.ITEM.HEIGHT.XXXS, 'Sub-choice height is clamped to XXXS')
})

// Test 1: Non-object choices get wrapped properly.
ava('formatChoices - simple non-object choices', (t) => {
  const input = ['apple', 'banana']
  const result = formatChoices(input as unknown as Choice[], 'defaultClass')

  t.true(Array.isArray(result))
  t.is(result.length, 2)
  // The names should match
  t.deepEqual(
    result.map((c) => c.name),
    ['apple', 'banana']
  )
  // Each object should have an id, slicedName, and the given className.
  result.forEach((choice) => {
    t.truthy(choice.id)
    t.is(choice.slicedName, choice.name.slice(0, 63))
    t.is(choice.className, 'defaultClass')
  })
})

// Test 2: Single non-group object
ava('formatChoices - single non-group object', (t) => {
  const input = [{ name: 'Test', value: 'val', height: PROMPT.ITEM.HEIGHT.XXL + 10 }]
  const result = formatChoices(input)
  t.is(result.length, 1)
  const formatted = result[0]
  t.is(formatted.name, 'Test')
  t.is(formatted.value, 'val')
  // Height should be clamped to PROMPT.ITEM.HEIGHT.XXL
  t.is(formatted.height, PROMPT.ITEM.HEIGHT.XXL)
  t.falsy(formatted.choices)
})

// Test 3: Group without sub-choice indices.
// Expect a group header followed by its sub-choices in their original order.
ava('formatChoices - group with sub-choices without indices', (t) => {
  const input = [
    {
      name: 'Group1',
      choices: [
        { name: 'Sub1', value: 'a' },
        { name: 'Sub2', value: 'b' }
      ]
    }
  ]
  const result = formatChoices(input)
  // One header + 2 sub-choices = 3 items.
  t.is(result.length, 3)
  const header = result[0]
  t.is(header.name, 'Group1')
  t.is(header.group, 'Group1')
  const subNames = result.slice(1).map((c) => c.name)
  t.deepEqual(subNames, ['Sub1', 'Sub2'])
  // All sub-choices should inherit the header group.
  result.slice(1).forEach((sub) => {
    t.is(sub.group, 'Group1')
  })
})

// Test 4: Group with sub-choices that have indices.
// The sub-choices should be reinserted according to their numeric index.
ava('formatChoices - group with sub-choices with indices', (t) => {
  const input = [
    {
      name: 'Group2',
      choices: [
        { name: 'A', value: 'a', index: 1 },
        { name: 'B', value: 'b' },
        { name: 'C', value: 'c', index: 0 },
        { name: 'D', value: 'd' }
      ]
    }
  ]
  const result = formatChoices(input)
  // Expect header + 4 sub-choices = 5 items.
  t.is(result.length, 5)
  const header = result[0]
  t.is(header.name, 'Group2')
  // Expected ordering: the non-indexed items are B and D in original order,
  // then we insert the indexed items (sorted ascending by index):
  //   - "C" with index 0 gets inserted at pos 0,
  //   - "A" with index 1 gets inserted at pos 1.
  // So the final order for sub-choices is: [ "C", "A", "B", "D" ]
  const subOrder = result.slice(1).map((c) => c.name)
  t.deepEqual(subOrder, ['C', 'A', 'B', 'D'])
})

// Test 5: A mix of group and non-group items.
ava('formatChoices - mix of group and non-group items', (t) => {
  const input = [
    'plain1',
    { name: 'Solo', value: 's' },
    {
      name: 'Group3',
      choices: [
        { name: 'SubG1', value: 'g1' },
        { name: 'SubG2', value: 'g2', index: 0 }
      ]
    },
    'plain2'
  ]
  const result = formatChoices(input as unknown as Choice[])
  // Expected order:
  //  - plain1 (non-object)
  //  - Solo (non-group)
  //  - Group3 header
  //  - Group3 sub-choices reinserted (SubG2 inserted at index 0, then SubG1)
  //  - plain2 (non-object)
  t.is(result.length, 6)
  t.is(result[0].name, 'plain1')
  t.is(result[1].name, 'Solo')
  t.is(result[2].name, 'Group3')
  // Group3 sub-choices:
  //   - The non-indexed sub-choice is SubG1.
  //   - The indexed one is SubG2 (index: 0) so it should be inserted at the beginning.
  // Therefore, sub-choices should come out as [SubG2, SubG1].
  t.deepEqual(result[3].name, 'SubG2')
  t.deepEqual(result[4].name, 'SubG1')
  t.is(result[5].name, 'plain2')
})

// Test 6: Clamping height values.
ava('formatChoices - clamping height', (t) => {
  const high = PROMPT.ITEM.HEIGHT.XXL + 50
  const low = PROMPT.ITEM.HEIGHT.XXXS - 10
  const input = [
    { name: 'High', height: high },
    { name: 'Low', height: low }
  ]
  const result = formatChoices(input)
  t.is(result[0].height, PROMPT.ITEM.HEIGHT.XXL)
  t.is(result[1].height, PROMPT.ITEM.HEIGHT.XXXS)
})

// Test 7: Group header preserves a custom group property.
// If a group object already has a custom `group` property, it should be used both
// in the header and for all its sub-choices.
ava('formatChoices - group header preserves custom group property', (t) => {
  const input = [
    {
      name: 'CustomGroup',
      group: 'MyGroup',
      choices: [{ name: 'Sub1' }, { name: 'Sub2' }]
    }
  ]
  const result = formatChoices(input)
  // Header should have group "MyGroup"
  t.is(result[0].group, 'MyGroup')
  // All sub-choices should also have group "MyGroup"
  result.slice(1).forEach((sub) => {
    t.is(sub.group, 'MyGroup')
  })
})
