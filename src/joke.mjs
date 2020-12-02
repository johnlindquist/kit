#!js

let response = await axios(`https://icanhazdadjoke.com/`, {
  headers: {
    Accept: "text/plain",
  },
})

console.log(response.data)
