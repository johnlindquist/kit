// Description: Logs out a Dad Joke from icanhazdadjoke.com

let response = await get(`https://icanhazdadjoke.com/`, {
  headers: {
    Accept: "text/plain",
  },
})

console.log(response.data)

let confirm = await prompt({
  name: "value",
  type: "confirm",
  message: `Shall I also speak the joke?`,
})

if (confirm.value) {
  let { say } = await import("./system/index.js")
  say(response.data)
}
