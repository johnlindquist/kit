let email_address = await arg(
  {
    placeholder: "Enter e-mail to join newsletter:",
    hint: `Enter "no" to remove "join" tab from main menu`,
  },
  md(`
    ## Emails include:
    * Tips for writing scripts
    * Community script highlights
    * Automation ideas
    * Upcoming features
        `)
)

if (email_address === "no") {
  await cli("settings", "join", "false")
} else {
  await post(
    `https://app.convertkit.com/forms/2216586/subscriptions`,
    {
      email_address,
    }
  )

  setPlaceholder(
    `Thanks! Make sure to confirm in your mail app 😇`
  )
  await wait(2000)

  await cli("settings", "join", "false")
}

await main("index")

export {}
