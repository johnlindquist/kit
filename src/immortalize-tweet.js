//Description: An example of combined two subprocesses to generate a Tweet Card
let [tweet] = await run("get-tweet")

let result = await run(
  "quote-on-image",
  tweet.handle,
  tweet.tweet,
  tweet.date,
  tweet.image
)

// console.log(result)
