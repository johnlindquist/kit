// Name: Sponsor to Unlock Script Kit Pro
// NameHTML: <span class="relative ml-0.5" style=""><svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="absolute h-4 left-0 top-0 text-primary "><g fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="currentColor"/></g></svg><svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="absolute h-4 left-0 top-0  text-primary "><g fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="currentColor"/></g></svg></span>
// Description: Unlock Debugger, Logger, and Support Development
// Enter: Open Sponsorship Page
// PreviewPath: $KIT/SPONSOR.md
// Exclude: sponsor
// FocusedClassName: shadow-md shadow-primary/25 bg-gradient-to-r from-transparent to-primary-50
// Index: 0

let sponsorUrl = `https://github.com/sponsors/johnlindquist/sponsorships?sponsor=johnlindquist&tier_id=235205`
try {
  sponsorUrl = (await readFile(kitPath('data', 'sponsor-url.txt'), 'utf-8')).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}
try {
  sponsorUrl = (await readFile(kitPath('data', 'sponsor-url.txt'), 'utf-8')).trim()
} catch (error) {
  warn(`Failed to read sponsor-url.txt`)
}

open(sponsorUrl)

export {}
