// Name: Unlock Script Kit Pro
// Description: Add Debugger, Logger, and Support Development
// Enter: Open Sponsorship Page
// PreviewPath: $KIT/SPONSOR.md

let sponsorUrl = `https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205`
try {
  sponsorUrl = (
    await readFile(
      kitPath("data", "sponsor-url.txt"),
      "utf-8"
    )
  ).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}
try {
  sponsorUrl = (
    await readFile(
      kitPath("data", "sponsor-url.txt"),
      "utf-8"
    )
  ).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}

open(sponsorUrl)

export {}
