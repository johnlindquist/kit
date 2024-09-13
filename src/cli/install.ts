import {
	formatDistanceToNow,
	parseISO
} from "@johnlindquist/kit-internal/date-fns"
import { KIT_FIRST_PATH } from "../core/utils.js"

let workflowLog =
	(color: "green" | "yellow" | "red" | "blue" | "magenta" | "cyan" | "white") =>
	(...messages: any[]) => {
		if (process.env.KIT_CONTEXT === "workflow") {
			// if any of the message items are not a string, convert them to a string
			for (let message of messages) {
				if (typeof message !== "string") {
					message = JSON.stringify(message)
				}
				global.echo(global.chalk`{${color} ${message}}`)
			}
		}
	}


let wlog = workflowLog("green")
let wwarn = workflowLog("yellow")
let werror = workflowLog("red")

let install = async (packageNames) => {
	let cwd = kenvPath()

	// if (process.env.SCRIPTS_DIR) {
	// 	cwd = kenvPath(process.env.SCRIPTS_DIR)
	// }

	let isYarn = await isFile(kenvPath("yarn.lock"))
	let [tool, toolArgs] = (
		isYarn
			? `yarn${global.isWin ? `.cmd` : ``}  add`
			: `npm${global.isWin ? `.cmd` : ``} i`
	).split(" ")

	let toolPath = global.isWin ? (isYarn ? "yarn" : "pnpm") : tool

	let toolExists = await isBin(toolPath)
	if (!toolExists) {
		toolPath = "pnpm"
	}

	let packages = packageNames.join(" ")
	let command = `${toolPath} ${toolArgs} -D ${packages}`.trim()

	wlog(`Running: ${command}`)
	wlog(`In: ${cwd}`)

	return await term({
		name: "pnpm install",
		command,
		env: {
			...global.env,
			PATH: KIT_FIRST_PATH,
			DISABLE_AUTO_UPDATE: "true" // Disable auto-update for zsh
		},
		cwd
	})
}

let packages = await arg(
	{
		enter: "Install",
		placeholder: "Which npm package/s would you like to install?"
	},
	async (input) => {
		if (!input || input?.length < 3)
			return [
				{
					info: true,
					miss: true,
					name: `Search for npm packages`
				}
			]
		type pkgs = {
			objects: {
				package: {
					name: string
					description: string
					date: string
				}
			}[]
		}
		let response = await get<pkgs>(
			`http://registry.npmjs.com/-/v1/search?text=${input}&size=20`
		)
		let packages = response.data.objects
		return packages.map((o) => {
			return {
				name: o.package.name,
				value: o.package.name,
				description: `${o.package.description} - ${formatDistanceToNow(
					parseISO(o.package.date)
				)} ago`
			}
		})
	}
)

let installNames = [...packages.split(" ")]
if (process?.send) global.setChoices([])


wlog(`Installing:`, {
	installNames,
	args,
	argOpts
})
await install([...installNames, ...args, ...argOpts])

export { packages }
