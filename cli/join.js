let email_address = await arg({
    placeholder: "Enter e-mail to join newsletter:",
    hint: `Enter "no" to remove join tab from main menu`,
}, md(`<div class="px-6 py-1">

## Emails include:
* Tips for writing scripts
* Community script highlights
* Automation ideas
* Upcoming features

</div>`));
if (email_address === "no") {
    await cli("prefs", "showJoin", "false");
}
else {
    await post(`https://app.convertkit.com/forms/2216586/subscriptions`, {
        email_address,
    });
    await cli("prefs", "showJoin", "false");
    setPlaceholder(`Thanks! Make sure to confirm in your mail app 😇`);
    await wait(2000);
}
await main("index");
export {};
