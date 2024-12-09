import type { Choice } from "../types"
import { PROMPT } from "./enum.js"
import { randomUUID as uuid } from "node:crypto"

export const defaultGroupClassName = "border-t-1 border-t-ui-border"
export const defaultGroupNameClassName =
  "font-medium text-xxs text-text-base/60 uppercase"

function clampHeight(h: number | undefined): number | undefined {
  if (typeof h === "number") {
    if (h > PROMPT.ITEM.HEIGHT.XXL) {
      return PROMPT.ITEM.HEIGHT.XXL
    }
    if (h < PROMPT.ITEM.HEIGHT.XXXS) {
      return PROMPT.ITEM.HEIGHT.XXXS
    }
    return h
  }
  return undefined
}

/**
 * Sorts choices by their index property while interleaving non-indexed items.
 */
function sortByIndex(items: Choice[]): Choice[] {
  let indexedCount = 0
  let nonIndexedCount = 0
  const len = items.length
  // Split into indexed and nonIndexed
  const indexed = new Array<Choice>(len)
  const nonIndexed = new Array<Choice>(len)
  for (let i = 0; i < len; i++) {
    const it = items[i]
    if (typeof it.index === "number") {
      indexed[indexedCount++] = it
    } else {
      nonIndexed[nonIndexedCount++] = it
    }
  }

  // Trim arrays
  indexed.length = indexedCount
  nonIndexed.length = nonIndexedCount

  // Sort indexed by index
  if (indexedCount > 1) {
    indexed.sort((a, b) => (a.index! - b.index!))
  }

  // Interleave
  const result = new Array<Choice>(0)
  let nonPos = 0
  for (let i = 0; i < indexedCount; i++) {
    const idxIt = indexed[i]
    const idx = idxIt.index ?? 0
    while (result.length < idx && nonPos < nonIndexedCount) {
      result.push(nonIndexed[nonPos++])
    }
    result.push(idxIt)
  }
  while (nonPos < nonIndexedCount) {
    result.push(nonIndexed[nonPos++])
  }

  return result
}

/**
 * Normalizes a single non-group choice.
 */
function normalizeSingleChoice(choice: unknown, index: number, className: string): Choice {
  if (choice === null || typeof choice !== "object") {
    const name = String(choice)
    const slicedName = name.length > 63 ? name.slice(0, 63) : name
    let finalChoice: Choice = {
      name,
      slicedName,
      slicedDescription: "",
      value: choice,
      id: index + "-" + slicedName,
      hasPreview: false,
      className,
      height: PROMPT.ITEM.HEIGHT.BASE, // Default height
    }

    // Clamp after assignment
    finalChoice.height = clampHeight(finalChoice.height) || PROMPT.ITEM.HEIGHT.BASE
    return finalChoice
  }

  const c = choice as Partial<Choice>
  const hasPreview = !!(c.preview || c.hasPreview)
  const nm = c.name || ""
  const slicedName = nm.length > 63 ? nm.slice(0, 63) : nm
  const dsc = c.description || ""
  const slicedDescription = dsc.length > 63 ? dsc.slice(0, 63) : dsc
  const val = c.value !== undefined ? c.value : c
  const cid = c.id || (index + "-" + slicedName)
  const nmClass = c.info ? "text-primary" : ""
  const skipVal = !!c.info
  const cls = c.className || (c.choices ? "" : className)

  // Remove any non-serializable properties (like functions in preview)
  if (typeof c.preview === "function") {
    delete c.preview
  }

  let finalChoice: Choice = {
    ...c,
    id: cid,
    name: nm,
    slicedName,
    slicedDescription,
    value: val,
    nameClassName: nmClass,
    skip: skipVal,
    className: cls,
    hasPreview,
    height: c.height !== undefined ? c.height : PROMPT.ITEM.HEIGHT.BASE,
  }

  // Clamp height
  finalChoice.height = clampHeight(finalChoice.height) || PROMPT.ITEM.HEIGHT.BASE

  return finalChoice
}

/**
 * Normalizes a group choice.
 */
function normalizeGroupChoice(
  groupChoice: Choice & { choices: unknown[] },
  index: number,
  className: string
): Choice[] {
  const groupHeader = normalizeSingleChoice(groupChoice, index, className)
  groupHeader.group = groupHeader.name
  groupHeader.skip = groupChoice.skip === undefined ? true : groupChoice.skip
  if (!groupHeader.className) groupHeader.className = defaultGroupClassName
  if (!groupHeader.nameClassName) groupHeader.nameClassName = defaultGroupNameClassName

  // Clamp height
  groupHeader.height = clampHeight(groupHeader.height) || PROMPT.ITEM.HEIGHT.BASE

  const groupName = groupHeader.name
  const subChoicesRaw = groupChoice.choices
  if (!Array.isArray(subChoicesRaw)) {
    throw new Error("Group choices must be an array.")
  }

  const subLen = subChoicesRaw.length
  const subChoices = new Array<Choice>(subLen)
  for (let i = 0; i < subLen; i++) {
    const subChoice = subChoicesRaw[i]
    if (typeof subChoice === "undefined") {
      throw new Error(`Undefined choice in ${groupName}`)
    }

    if (subChoice !== null && typeof subChoice === "object") {
      const sc = subChoice as Partial<Choice>
      const prev = !!(sc.preview || sc.hasPreview)
      const nm = sc.name || ""
      const sn = nm.length > 63 ? nm.slice(0, 63) : nm
      const dsc = sc.description || ""
      const sd = dsc.length > 63 ? dsc.slice(0, 63) : dsc
      const cid = sc.id || uuid()
      const val = sc.value !== undefined ? sc.value : sc
      const cls = sc.className || className

      // Remove any non-serializable properties (like functions in preview)
      if (typeof sc.preview === "function") {
        delete sc.preview
      }

      let finalSubChoice: Choice = {
        ...sc,
        name: nm,
        slicedName: sn,
        slicedDescription: sd,
        value: val,
        id: cid,
        group: groupName,
        className: cls,
        hasPreview: prev,
        height: sc.height !== undefined ? sc.height : PROMPT.ITEM.HEIGHT.BASE,
      }

      // Clamp height
      finalSubChoice.height = clampHeight(finalSubChoice.height) || PROMPT.ITEM.HEIGHT.BASE

      subChoices[i] = finalSubChoice
    } else {
      const strVal = String(subChoice)
      const sn = strVal.length > 63 ? strVal.slice(0, 63) : strVal
      let finalSubChoice: Choice = {
        name: strVal,
        value: strVal,
        slicedName: sn,
        slicedDescription: "",
        group: groupName,
        className,
        id: uuid(),
        height: PROMPT.ITEM.HEIGHT.BASE,
        hasPreview: false,
      }

      // Clamp height
      finalSubChoice.height = clampHeight(finalSubChoice.height) || PROMPT.ITEM.HEIGHT.BASE

      subChoices[i] = finalSubChoice
    }
  }

  // Sort sub-choices by index
  const sortedSubChoices = sortByIndex(subChoices)
  const result = new Array<Choice>(sortedSubChoices.length + 1)
  result[0] = groupHeader
  for (let i = 0; i < sortedSubChoices.length; i++) {
    result[i + 1] = sortedSubChoices[i]
  }
  return result
}

/**
 * Formats choices array.
 */
export function formatChoices(choices: Choice[], className = ""): Choice[] {
  if (!Array.isArray(choices)) {
    throw new Error("Choices must be an array. Received string")
  }

  // Flatten
  const flattenedChoices: Choice[] = []
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i]
    if (choice && typeof choice === "object" && "choices" in choice) {
      const gc = normalizeGroupChoice(choice as Choice & { choices: unknown[] }, i, className)
      for (let j = 0; j < gc.length; j++) flattenedChoices.push(gc[j])
    } else {
      flattenedChoices.push(normalizeSingleChoice(choice, i, className))
    }
  }

  // Group by group
  const groupsObj: Record<string, Choice[]> = Object.create(null)
  for (let i = 0; i < flattenedChoices.length; i++) {
    const fc = flattenedChoices[i]
    const gk = fc.group === undefined ? "__UNDEF__" : fc.group
    const arr = groupsObj[gk] || (groupsObj[gk] = [])
    arr.push(fc)
  }

  const result: Choice[] = []
  const groupKeys = Object.keys(groupsObj)
  for (let i = 0; i < groupKeys.length; i++) {
    const gk = groupKeys[i]
    const items = groupsObj[gk]
    if (gk === "__UNDEF__") {
      // No group: just sort
      const sorted = sortByIndex(items)
      for (let x = 0; x < sorted.length; x++) result.push(sorted[x])
    } else {
      const groupName = gk
      // Find header
      let headerIndex = -1
      for (let x = 0; x < items.length; x++) {
        if (items[x].name === groupName) {
          headerIndex = x
          break
        }
      }

      if (headerIndex >= 0) {
        const header = items[headerIndex]
        const count = items.length - 1
        if (count > 0) {
          const subItems = new Array<Choice>(count)
          let si = 0
          for (let x = 0; x < items.length; x++) {
            if (x !== headerIndex) {
              subItems[si++] = items[x]
            }
          }
          const sorted = sortByIndex(subItems)
          result.push(header)
          for (let s = 0; s < sorted.length; s++) result.push(sorted[s])
        } else {
          // Only header, no sub items
          result.push(header)
        }
      } else {
        // No header found, just sort all
        const sorted = sortByIndex(items)
        for (let s = 0; s < sorted.length; s++) result.push(sorted[s])
      }
    }
  }

  return result
}
