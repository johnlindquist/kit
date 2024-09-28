// Name: npm
// Description: Add/remove npm packages
// Keyword: npm

import { CLI } from "../cli"
import { cliShortcuts } from "../core/utils.js"

while (true) {
	let script = await arg(
		{
			placeholder: "What would you like to do?",
			shortcuts: cliShortcuts,
			enter: "Select"
		},
		[
			{
				name: "Install an npm package",
				value: "install",
				shortcode: "i"
			},
			{
				name: "Update an npm package",
				value: "update-package",
				shortcode: "up"
			},
			{
				name: "Uninstall an npm package",
				value: "uninstall",
				shortcode: "un"
			},
			{
				name: "Get more info about an npm packaage",
				value: "more-info",
				shortcode: "info"
			},
			{
				name: "Open a Terminal to Manually Install/Uninstall",
				value: "manual-npm"
			}
		]
	)

	setInput("")
	setFilterInput("")
	delete arg.keyword

	await cli(script as keyof CLI)
}

export {}
