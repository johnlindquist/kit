import type { Choice } from "../types"
import { PROMPT } from "./enum.js"
import { randomUUID as uuid } from "node:crypto"

export let defaultGroupClassName = "border-t-1 border-t-ui-border"
export let defaultGroupNameClassName =
	"font-medium text-xxs text-text-base/60 uppercase"

const sortByIndex = (items: Choice[]) => {
	const indexed = items.filter(item => typeof item.index === 'number')
	const nonIndexed = items.filter(item => typeof item.index !== 'number')
	
	indexed.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
	
	const result = []
	let indexedPos = 0
	let nonIndexedPos = 0
	
	while (indexedPos < indexed.length || nonIndexedPos < nonIndexed.length) {
		const nextIndexed = indexed[indexedPos]
		
		if (!nextIndexed) {
			result.push(...nonIndexed.slice(nonIndexedPos))
			break
		}
		
		if (nextIndexed.index === undefined || nextIndexed.index > result.length) {
			if (nonIndexedPos < nonIndexed.length) {
				result.push(nonIndexed[nonIndexedPos++])
			} else {
				result.push(nextIndexed)
				indexedPos++
			}
		} else {
			result.push(nextIndexed)
			indexedPos++
		}
	}
	
	return result
}

export let formatChoices = (choices: Choice[], className = ""): Choice[] => {
	if (Array.isArray(choices)) {
		const formattedChoices = (choices as Choice<any>[]).flatMap((choice, index) => {
			const isChoiceObject = typeof choice === "object"

			if (!isChoiceObject) {
				let name = String(choice)
				let slicedName = (choice as string).slice(0, 63)
				return {
					name,
					slicedName,
					value: choice,
					id: `${index}-${slicedName}`,
					hasPreview: false,
					className
				}
			}

			let hasPreview = Boolean(choice?.preview || choice?.hasPreview)
			let slicedName = choice?.name?.slice(0, 63) || ""
			let properChoice = {
				id: choice?.id || `${index}-${slicedName || ""}`,
				name: choice?.name || "",
				slicedName,
				slicedDescription: choice?.description?.slice(0, 63) || "",
				value: choice?.value || choice,
				nameClassName: choice?.info ? "text-primary" : "",
				skip: !!choice?.info,
				className: choice?.className || choice?.choices ? "" : className,
				index: choice?.index,
				...choice,
				hasPreview
			}

			if (properChoice.height > PROMPT.ITEM.HEIGHT.XXL) {
				properChoice.height = PROMPT.ITEM.HEIGHT.XXL
			}
			if (properChoice.height < PROMPT.ITEM.HEIGHT.XXXS) {
				properChoice.height = PROMPT.ITEM.HEIGHT.XXXS
			}

			const choiceChoices = properChoice?.choices
			if (!choiceChoices) {
				return properChoice
			}

			let isArray = Array.isArray(choiceChoices)
			if (!isArray) {
				throw new Error(
					`Group choices must be an array. Received ${typeof choiceChoices}`
				)
			}

			let groupedChoices = []

			properChoice.group = properChoice.name
			properChoice.skip =
				typeof choice?.skip === "undefined" ? true : choice.skip
			properChoice.className ||= defaultGroupClassName
			properChoice.nameClassName ||= defaultGroupNameClassName
			properChoice.height ||= PROMPT.ITEM.HEIGHT.XXXS

			delete properChoice.choices
			groupedChoices.push(properChoice)

			const subChoices = choiceChoices.map((subChoice) => {
				if (typeof subChoice === "undefined") {
					throw new Error(`Undefined choice in ${properChoice.name}`)
				}

				if (typeof subChoice === "object") {
					return {
						name: subChoice?.name,
						slicedName: subChoice?.name?.slice(0, 63) || "",
						slicedDescription: subChoice?.description?.slice(0, 63) || "",
						value: subChoice?.value || subChoice,
						id: subChoice?.id || uuid(),
						group: choice?.name,
						className,
						index: subChoice?.index,
						...subChoice,
						hasPreview: Boolean(subChoice?.preview || subChoice?.hasPreview)
					}
				} else {
					return {
						name: String(subChoice),
						value: String(subChoice),
						slicedName: String(subChoice)?.slice(0, 63) || "",
						slicedDescription: "",
						group: choice?.name,
						className,
						id: uuid()
					}
				}
			})

			// Sort and add sub-choices
			groupedChoices.push(...sortByIndex(subChoices))
			return groupedChoices
		})

		// Sort top-level items while preserving groups
		const groups = new Map<string | undefined, Choice[]>()
		formattedChoices.forEach(choice => {
			const group = choice.group
			if (!groups.has(group)) {
				groups.set(group, [])
			}
			groups.get(group)?.push(choice)
		})

		const result: Choice[] = []
		for (const [group, items] of groups) {
			if (group === undefined) {
				result.push(...sortByIndex(items))
			} else {
				const groupHeader = items.find(item => item.name === group)
				const groupItems = items.filter(item => item.name !== group)
				if (groupHeader) {
					result.push(groupHeader)
				}
				result.push(...sortByIndex(groupItems))
			}
		}

		return result
	}

	if (choices) {
		throw new Error(`Choices must be an array. Received ${typeof choices}`)
	}
}
