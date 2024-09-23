import { getRecentLimit } from "../api/recent.js"
import type { Choice, Script } from "../types"

export let groupChoices = (
  choices: Choice[],
  options = {}
) => {
  let {
    groupKey,
    missingGroupName,
    order,
    endOrder,
    sortChoicesKey,
    recentKey,
    recentLimit,
    hideWithoutInput,
    excludeGroups,
    tagger,
  } = {
    groupKey: "group",
    missingGroupName: "No Group",
    order: [],
    endOrder: [],
    sortChoicesKey: [],
    hideWithoutInput: [],
    recentKey: "",
    recentLimit: getRecentLimit(),
    excludeGroups: [],
    tagger: null,
    ...options,
  }

  // A group is a choice with a group key and "choices" array
  type Group = Choice & {
    name: string
    group: string
    choices: Choice[]
  }
  let groups: Group[] = []

  let recentGroup = {
    skip: true,
    group: "Recent",
    name: "Recent",
    value: "Recent",
    choices: [],
  } as Group

  let passGroup = {
    skip: true,
    pass: true,
    group: "Pass",
    value: "Pass",
    name: 'Pass "{input}" to...',
    choices: [],
  } as Group

  // Pre-compute lowercase versions of order and endOrder
  const lowerOrder = order.map(o => o.toLowerCase())
  const lowerEndOrder = endOrder.map(o => o.toLowerCase())

  // Create a Set for faster lookups
  const excludeGroupsSet = new Set(excludeGroups)

  // Use a Map for faster group lookups
  const groupMap = new Map<string, Group>()

  for (let choice of choices) {
    if (tagger) {
      tagger(choice)
    }

    if (
      excludeGroupsSet.has(choice?.group) ||
      excludeGroupsSet.has((choice as Script)?.kenv)
    ) {
      choice.exclude = true
    }

    if (
      choice[recentKey] &&
      !choice.pass &&
      !(
        typeof choice?.recent === "boolean" &&
        choice?.recent === false
      ) &&
      recentGroup.choices?.length < getRecentLimit()
    ) {
      recentGroup.choices.push(choice)
      continue
    }

    if (choice?.pass) {
      choice.group = "Pass"
      if (!choice.previewPath) {
        choice.preview = "<div></div>"
      }
      passGroup.choices.push(choice)
      continue
    }

    const group =
      choice.group || choice[groupKey] || missingGroupName
    let groupParent = groupMap.get(group)

    if (!groupParent) {
      groupParent = {
        skip: true,
        userGrouped: !!choice?.group,
        id: `group-${group}-${choice.id}`,
        group,
        name: group,
        value: group,
        choices: [],
        hideWithoutInput: hideWithoutInput.includes(group),
      }
      groupMap.set(group, groupParent)
      groups.push(groupParent)
    }

    groupParent.choices.push(choice)
    choice.group = group
    choice.hideWithoutInput ||=
      hideWithoutInput.includes(group)
  }

  // Handle recent choices
  if (recentGroup.choices.length > 0) {
    recentGroup.choices = recentGroup.choices
      .sort((a, b) => {
        if (a?.[recentKey] < b?.[recentKey]) {
          return 1
        }
        if (a?.[recentKey] > b?.[recentKey]) {
          return -1
        }
        return 0
      })
      .slice(0, recentLimit) as Choice[] // Apply the recentLimit here
  }

  // Convert back to array and sort
  groups = Array.from(groupMap.values()).sort(
    (a: Group, b: Group) => {
      const aGroup = a.group.toLowerCase()
      const bGroup = b.group.toLowerCase()
      const aOrder = lowerOrder.indexOf(aGroup)
      const bOrder = lowerOrder.indexOf(bGroup)
      const endAOrder = lowerEndOrder.indexOf(aGroup)
      const endBOrder = lowerEndOrder.indexOf(bGroup)

      // If both elements are in the order array, sort them as per the order array
      if (aOrder !== -1 && bOrder !== -1) {
        return aOrder - bOrder
      }
      // If a is in the order array, or b is in the endOrder array, a comes first
      if (aOrder !== -1 || endBOrder !== -1) {
        return -1
      }

      // If b is in the order array, or a is in the endOrder array, b comes first
      if (bOrder !== -1 || endAOrder !== -1) {
        return 1
      }

      // If both elements are in the endOrder array, sort them as per the endOrder array
      if (endAOrder !== -1 && endBOrder !== -1) {
        return endAOrder - endBOrder
      }

      // Sort "userGrouped" "true" before "false"
      if (a.userGrouped && !b.userGrouped) {
        return -1
      }
      if (!a.userGrouped && b.userGrouped) {
        return 1
      }

      // If neither are in the order or endOrder arrays, and not differentiated by userGrouped, sort them alphabetically
      return aGroup.localeCompare(bGroup)
    }
  )

  // if missingGroupName === "No Group", then move it to the end
  if (missingGroupName === "No Group") {
    let noGroupIndex = groups.findIndex(
      g => g.name === missingGroupName
    )
    if (noGroupIndex > -1) {
      let noGroup = groups.splice(noGroupIndex, 1)
      groups.push(noGroup[0])
    }
  }

  groups = groups.map((g, i) => {
    const maybeKey = sortChoicesKey?.[i]
    const sortKey =
      typeof maybeKey === "boolean" && maybeKey === false
        ? false
        : typeof maybeKey === "string"
        ? maybeKey
        : "name"

    if (sortKey) {
      g.choices = g.choices.sort((a, b) => {
        if (a?.[sortKey] < b?.[sortKey]) {
          return -1
        }
        if (a?.[sortKey] > b?.[sortKey]) {
          return 1
        }
        return 0
      })
    }

    if (g?.choices?.[0]?.preview) {
      g.preview = g.choices[0].preview
      g.hasPreview = true
    }

    return g
  })

  if (recentGroup.choices.length > 0) {
    groups.unshift(recentGroup)
  }

  if (passGroup.choices.length > 0) {
    groups.push(passGroup)
  }

  return groups
}
