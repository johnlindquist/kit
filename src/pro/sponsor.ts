// Name: Sponsors Only
// Description: Requires a GitHub Sponsorship

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

let content = `# ${featureName} Requires Pro Account`
await div({
	html: md(content + proPane()),
	enter: "Continue to Sponsorship Page",
	shortcuts: [escapeShortcut],
	width: 640,
	height: 640
})

open(sponsorUrl)

export {}
