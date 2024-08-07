import { escapeShortcut, cmd, sortBy, uniq } from "../core/utils.js"
import { createAppChoices } from "./common.js"
// Name: App Launcher
// Description: Select an App to Launch
// Trigger: ;
// Cache: true

if (isLinux) {
	await div(md("The App Launcher is not available on Linux. PRs welcome!"))
	exit()
}

if (!flag.prep) {
	preload()
}

let appsDb = await db(
	kitPath("db", "apps.json"),
	async () => {
		setResize(true)
		setChoices([
			{
				name: "First Run: Indexing Apps and Caching Icons...",
				description:
					"Please hold a few seconds while Script Kit creates icons for your apps and preferences for future use.",
				info: true
			}
		])

		clearTabs()
		setPlaceholder("One sec...")

		let choices = await createAppChoices()
		return {
			choices
		}
	},
	!flag?.refresh
)

if (flag?.prep) {
	exit()
} else {
	let app = await arg(
		{
			key: "app-launcher",
			input: (flag?.input as string) || "",
			resize: true,
			placeholder: "Select an app to launch",
			shortcuts: [
				escapeShortcut,
				{
					name: "Refresh Apps",
					visible: true,
					key: `${cmd}+enter`,
					bar: "right",
					onPress: async (input) => {
						setPlaceholder(`Refreshing apps...`)
						await run(
							kitPath("main", "app-launcher.js"),
							"--input",
							input,
							"--refresh"
						)
					}
				}
			]
		},
		appsDb.choices as any
	)
	if (app) {
		open(app)
	}
}
