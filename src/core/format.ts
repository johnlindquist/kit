import type { Choice } from '../types'
import { PROMPT } from './enum.js'
import { randomUUID as uuid } from 'node:crypto'

export let defaultGroupClassName = 'border-t-1 border-t-ui-border'
export let defaultGroupNameClassName = 'font-medium text-xxs text-text-base opacity-60 uppercase'

/**
 * Given an array of items, separate those with an index property from those without,
 * and then insert the indexed items into the non-indexed array at the positions specified
 * by their index values. (If an index is too high, the item is appended.)
 */
const insertIndexedItems = (items: Choice[]): Choice[] => {
  const nonIndexed: Choice[] = []
  const indexed: Choice[] = []

  items.forEach((item) => {
    if (typeof item.index === 'number') {
      indexed.push(item)
    } else {
      nonIndexed.push(item)
    }
  })

  // Ensure indexed items are in ascending order of their index.
  indexed.sort((a, b) => (a.index as number) - (b.index as number))

  // Insert each indexed item into the non-indexed array.
  indexed.forEach((item) => {
    const pos = item.index! < 0 ? 0 : item.index!
    if (pos >= nonIndexed.length) {
      nonIndexed.push(item)
    } else {
      nonIndexed.splice(pos, 0, item)
    }
  })

  return nonIndexed
}

export let formatChoices = (choices: Choice[], className = ''): Choice[] => {
  if (!Array.isArray(choices)) {
    throw new Error(`Choices must be an array. Received ${typeof choices}`)
  }

  // Determine if all top-level items are non-group (i.e. do not have a "choices" property).
  const isPureNonGroup = choices.every((choice) => typeof choice !== 'object' || !('choices' in choice))

  const result: Choice[] = []

  choices.forEach((choice, index) => {
    // --- Non-object choices – wrap them in an object.
    if (typeof choice !== 'object') {
      const name = String(choice)
      const slicedName = name.slice(0, 63)
      result.push({
        name,
        slicedName,
        value: choice,
        id: `${index}-${slicedName}`,
        hasPreview: false,
        className
      })
      return
    }

    // --- Format a base choice object.
    const hasPreview = Boolean(choice.preview || choice.hasPreview)
    const slicedName = choice.name ? choice.name.slice(0, 63) : ''
    let formatted: Choice = {
      id: choice.id || `${index}-${slicedName}`,
      name: choice.name || '',
      slicedName,
      slicedDescription: choice.description ? choice.description.slice(0, 63) : '',
      value: choice.value || choice,
      nameClassName: choice.info ? 'text-primary' : '',
      skip: !!choice.info,
      className: choice.className || className,
      index: choice.index,
      ...choice,
      hasPreview
    }

    // Clamp height if specified.
    if (typeof formatted.height === 'number') {
      if (formatted.height > PROMPT.ITEM.HEIGHT.XXL) {
        formatted.height = PROMPT.ITEM.HEIGHT.XXL
      }
      if (formatted.height < PROMPT.ITEM.HEIGHT.XXXS) {
        formatted.height = PROMPT.ITEM.HEIGHT.XXXS
      }
    }

    // --- If the choice is a group (has nested choices), process it.
    if (formatted.choices !== undefined) {
      if (!Array.isArray(formatted.choices)) {
        throw new Error('Group choices must be an array.')
      }
      if (formatted.choices.some((subChoice) => subChoice === undefined)) {
        throw new Error(`Undefined choice in ${formatted.name}`)
      }
      // Process the group header.
      formatted.group = formatted.group || formatted.name
      formatted.skip = choice.skip === undefined ? true : choice.skip
      formatted.className = formatted.className || defaultGroupClassName
      formatted.nameClassName = formatted.nameClassName || defaultGroupNameClassName
      if (!formatted.height) {
        formatted.height = PROMPT.ITEM.HEIGHT.XXXS
      }
      // Create a copy of the header without nested choices.
      const groupHeader: Choice = { ...formatted }
      delete groupHeader.choices

      // Process sub-choices.
      const subChoices = formatted.choices.map((subChoice, subIndex) => {
        if (subChoice === undefined) {
          throw new Error(`Undefined choice in ${formatted.name}`)
        }
        if (typeof subChoice !== 'object') {
          const name = String(subChoice)
          const slicedName = name.slice(0, 63)
          return {
            name,
            slicedName,
            value: subChoice,
            id: `${subIndex}-${slicedName}`,
            group: groupHeader.group,
            className,
            hasPreview: false
          }
        }
        const subHasPreview = Boolean(subChoice.preview || subChoice.hasPreview)
        const subSlicedName = subChoice.name ? subChoice.name.slice(0, 63) : ''
        let formattedSub: Choice = {
          id: subChoice.id || uuid(),
          name: subChoice.name || '',
          slicedName: subSlicedName,
          slicedDescription: subChoice.description ? subChoice.description.slice(0, 63) : '',
          value: subChoice.value || subChoice,
          group: groupHeader.group, // use parent's group
          className,
          index: subChoice.index,
          ...subChoice,
          hasPreview: subHasPreview
        }
        if (typeof formattedSub.height === 'number') {
          if (formattedSub.height > PROMPT.ITEM.HEIGHT.XXL) {
            formattedSub.height = PROMPT.ITEM.HEIGHT.XXL
          }
          if (formattedSub.height < PROMPT.ITEM.HEIGHT.XXXS) {
            formattedSub.height = PROMPT.ITEM.HEIGHT.XXXS
          }
        }
        return formattedSub
      })

      // Reinsert any sub-choices that have index properties.
      const orderedSubChoices = insertIndexedItems(subChoices)
      result.push(groupHeader, ...orderedSubChoices)
    } else {
      // Non-group item.
      result.push(formatted)
    }
  })

  // If all top-level items are non-group, reinsert index ordering.
  if (isPureNonGroup) {
    return insertIndexedItems(result)
  }
  return result
}
