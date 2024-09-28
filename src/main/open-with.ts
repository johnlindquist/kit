// Exclude: true
// Description: Open with...

import type { Open } from "../types/packages"
import { createAppChoices } from "./common.js"

let filePath = await path()
setName(``)

let appsDb = await db("apps", async () => {
	setChoices([])
	clearTabs()
	setPlaceholder("One sec...")
	setPanel(
		md(`# First Run: Indexing Apps and Caching Icons...
  
  Please hold a few seconds while Script Kit creates icons for your apps and preferences for future use.
    `)
	)
	let choices = await createAppChoices()
	setFooter(``)
	return {
		choices
	}
})
let input = ""
let app = await arg(
	{
		input: (flag?.input as string) || "",
		placeholder: "Open with...",
		onInput: (i) => {
			input = i
		}
	},
	appsDb.choices
)

log(`Opening ${input} with ${app} and ${flag?.cmd ? "cmd" : "open"}`)
if (flag?.cmd) {
	await remove(kitPath("db", "apps.json"))
	await run(kitPath("main", "app-launcher.js"), "--input", input)
} else {
	await Promise.all([
		(open as unknown as Open)(filePath, {
			app: {
				name: app
			}
		}),
		await hide()
	])
}
