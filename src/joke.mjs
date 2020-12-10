/**
 * Description: Logs out a Dad Joke from icanhazdadjoke.com
 *
 */

let response = await get(`https://icanhazdadjoke.com/`, {
  headers: {
    Accept: "text/plain",
  },
})

console.log(response.data)
