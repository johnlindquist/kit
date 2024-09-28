import type { Choice } from "../types"
import { PROMPT } from "./enum.js"

export let defaultGroupClassName = "border-t-1 border-t-ui-border"
export let defaultGroupNameClassName =
	"font-medium text-xxs text-text-base/60 uppercase"

export let formatChoices = (choices: Choice[], className = ""): Choice[] => {
	if (Array.isArray(choices)) {
		return (choices as Choice<any>[]).flatMap((choice, index) => {
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

			delete properChoice.choices

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

			groupedChoices.push(properChoice)

			choiceChoices.forEach((subChoice) => {
				if (typeof subChoice === "undefined") {
					throw new Error(`Undefined choice in ${properChoice.name}`)
				}

				if (typeof subChoice === "object") {
					groupedChoices.push({
						name: subChoice?.name,
						slicedName: subChoice?.name?.slice(0, 63) || "",
						slicedDescription: subChoice?.description?.slice(0, 63) || "",
						value: subChoice?.value || subChoice,
						id: subChoice?.id || uuid(),
						group: choice?.name,
						className,
						...subChoice,
						hasPreview: Boolean(subChoice?.preview || subChoice?.hasPreview)
					})
				} else {
					groupedChoices.push({
						name: String(subChoice),
						value: String(subChoice),
						slicedName: String(subChoice)?.slice(0, 63) || "",
						slicedDescription: "",
						group: choice?.name,
						className,
						id: uuid()
					})
				}
			})

			return groupedChoices
		})
	}

	if (choices) {
		throw new Error(`Choices must be an array. Received ${typeof choices}`)
	}
}
