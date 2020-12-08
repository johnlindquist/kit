#!/usr/bin/env js
/**
 * Logs out a Dad Joke from icanhazdadjoke.com
 *
 * Usage:
 * joke
 */

let response = await get(`https://icanhazdadjoke.com/`, {
  headers: {
    Accept: "text/plain",
  },
})

console.log(response.data)
