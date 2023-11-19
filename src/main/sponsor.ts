// Name: Sponsor to Unlock Script Kit Pro
// NameHTML: <span class="relative ml-0.5" style=""><span class="absolute animate-ping-emoji text-lg">🌟</span><span class="text-lg animate-pulse-emoji">🌟</span></span>
// Description: Unlock Debugger, Logger, and Support Development
// Enter: Open Sponsorship Page
// PreviewPath: $KIT/SPONSOR.md
// Pass: true
// FocusedClassName: shadow-md shadow-primary/25 bg-gradient-to-r from-transparent to-primary-50

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
