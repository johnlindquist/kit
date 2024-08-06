// Name: Sponsors Only

import { escapeShortcut, proPane } from "../core/utils.js"

let sponsorUrl =
	"https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205"
try {
	sponsorUrl = (
		await readFile(kitPath("data", "sponsor-url.txt"), "utf-8")
	).trim()
} catch (error) {
	warn("Failed to read sponsor-url.txt")
}

let featureName = await arg("Feature Name")

let content = `# Please sponsor to unlock ${featureName}`
await div({
	html: md(content + proPane()),
	description: `${featureName} requires a GitHub Sponsorship`,
	enter: "Continue to Sponsorship Page",
	shortcuts: [escapeShortcut],
	width: 640,
	height: 640
})

open(sponsorUrl)

export {}
