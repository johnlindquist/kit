#!js
let response = await axios.get(
  `https://api.github.com/users/${$1}`
)

await JSON.log(response.data)
