// Name: File Search
// Description: Search For Files then Take Actions
// Trigger: .
// Pass: true

import { keywordInputTransformer, isMac } from "../core/utils.js"
import { actionFlags } from "./common.js"

let flags = {}
for (let flag of actionFlags) {
	flags[flag.name] = flag
}

let pleaseType = [
	{
		name: "Type at least 3 characters",
		info: true
	}
]

let transformer = keywordInputTransformer(arg?.keyword)
let selectedFile = await arg(
	{
		preventCollapse: true,
		input: arg?.pass ? arg.pass : arg?.keyword ? `${arg.keyword} ` : "",
		...(!arg?.pass && { initialChoices: pleaseType }),
		onMenuToggle: async (input, state) => {
			if (state.flag) {
				setPlaceholder("Select Action")
				setEnter("Submit")
			} else {
				setPlaceholder("Search Files")
				setEnter("Actions")
			}
		},
		onSubmit: async (input, state) => {
			if (!state?.flag) {
				await setFlagValue(state?.focused)
				return preventSubmit
			}
		},
		placeholder: "Search Files",
		enter: "Actions",
		shortcuts: [
			{
				key: "right"
			}
		],
		resize: true,
		flags
	},
	async (input) => {
		input = transformer(input)

		if (!input || input?.length < 3) {
			return pleaseType
		}
		let files = await fileSearch(input)

		if (files.length === 0) {
			return [
				{
					name: `No results found for ${input}`,
					info: true
				}
			]
		}
		return files.map((p) => {
			return {
				name: path.basename(p),
				description: p,
				drag: p,
				value: p
			}
		})
	}
)

await actionFlags.find((f) => flag?.[f.name])?.action?.(selectedFile)
