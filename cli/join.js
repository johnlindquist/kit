// Description: Subscribe to the Script Kit Newsletter
let email_address = await arg({
    placeholder: "Enter e-mail to join newsletter:",
}, md(`<div class="p-6">

## Script Kit Newletters include:
* Tips for writing scripts
* Community script highlights
* Automation ideas
* Upcoming features

</div>`));
await post(`https://app.convertkit.com/forms/2216586/subscriptions`, {
    email_address,
});
setPanel(`Thanks! Make sure to confirm in your mail app 😇`, `p-6 text-xl`);
await wait(2000);
export {};
