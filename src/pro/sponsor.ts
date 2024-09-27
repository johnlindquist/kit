// Name: Sponsors Only
import { escapeShortcut, proPane } from "../core/utils.js"
let sponsorUrl =
  "https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205"
try {
  sponsorUrl = (
    await readFile(
      kitPath("data", "sponsor-url.txt"),
      "utf-8"
    )
  ).trim()
} catch (error) {
  warn("Failed to read sponsor-url.txt")
}
let featureName = await arg("Feature Name")
let content = `# Please sponsor to unlock ${featureName}`

export let signInShortcut = {
  name: "Sign In",
  key: `${cmd}+enter`,
  bar: "right" as const,
  onPress: async () => {
    await run(kitPath("main", "sign-in.js"))
  },
}

await div({
  html: md(content + proPane()),
  description: `${featureName} requires a GitHub Sponsorship`,
  enter: "Open Sponsorship Page",
  shortcuts: [signInShortcut, escapeShortcut],
  width: 640,
  height: 640,
  alwaysOnTop: true,
})
open(sponsorUrl)
//# sourceMappingURL=sponsor.js.map
