// Name: Process List
// Description: Manage/Terminate Running Kit Processes
// Enter: View Running Processes
// Keyword: p
// Log: false

import {
	escapeShortcut,
	cmd,
	viewLogShortcut,
	terminateProcessShortcut
} from "../core/utils.js"
let formatProcesses = async () => {
	let processes: any = await getProcesses()
	processes = processes
		.filter((p) => p?.scriptPath)
		.filter((p) => !p?.scriptPath?.endsWith("processes.js"))
		.map((p) => {
			return {
				id: String(p.pid),
				name: p?.scriptPath,
				description: `${p.pid}`,
				value: p
			}
		})

	return processes
}

let checkProcesses = async () => {
	let newProcesses = await formatProcesses()
	let sameProcesses =
		JSON.stringify(newProcesses) === JSON.stringify(currentProcesses)
	if (!sameProcesses) {
		setChoices(newProcesses)
		currentProcesses = newProcesses
	}
}

let id = setInterval(async () => {
	await checkProcesses()
}, 1000)

let currentProcesses = await formatProcesses()

let argPromise = arg(
	{
		placeholder: "Focus Prompt",
		enter: "Focus",
		shortcuts: [
			escapeShortcut,
			{
				name: "Edit",
				key: `${cmd}+o`,
				onPress: async (input, state) => {
					clearInterval(id)
					await edit(state.focused.value.scriptPath)
				},
				bar: "right"
			},
			{
				...viewLogShortcut,
				onPress: async (input, state) => {
					clearInterval(id)
					await viewLogShortcut.onPress(input, state)
				}
			},
			{
				...terminateProcessShortcut,
				onPress: async (input, state) => {
					await terminateProcessShortcut.onPress(input, state)
					await checkProcesses()
				}
			}
		],
		onAbandon: async () => {
			clearInterval(id)
			await mainScript()
		}
	},
	currentProcesses
)
let { pid, scriptPath }: any = await argPromise
clearInterval(id)

let prompts = await getPrompts()
const prompt = prompts.find((p) => p.pid === pid)

await prompt.focus()
