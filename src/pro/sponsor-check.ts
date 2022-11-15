// Name: Sponsor Check

let check = await arg("Sponsor Check")

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

if (check === "success") {
  await div(`# You are a Sponsor! Thank you!`)
} else {
  await div(`# You are not currently a Sponsor...
  
  Please go to [https://github.com/sponsors/johnlindquist](${sponsorUrl}) to become a sponsor to unlock this feature.
  `)
}

export {}
