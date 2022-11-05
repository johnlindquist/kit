// Name: Sponsors Only
// Description: Requires a GitHub Sponsorship

import { backToMainShortcut } from "../core/utils.js"

let featureName = await arg("Feature Name")

let content = `# ${featureName} Requires Sponsorship

## A Script Kit Pro Sponsorship is Required to Use ${featureName}

Please go to [https://github.com/sponsors/johnlindquist](https://github.com/sponsors/johnlindquist) to become a sponsor to unlock this feature.

> ⭐️ Make sure to select a "Script Kit Pro" sponsorship tier.
`
await div({
  html: md(content),
  enter: "Continue to Sponsorship Page",
  shortcuts: [backToMainShortcut],
})

open(`https://github.com/sponsors/johnlindquist`)

export {}
