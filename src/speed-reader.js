let { default: readline } = await need("readline")

let wpm =
  1000 * (60 / (await arg("Enter words per minute:")))

let text = paste()
  .split("\n")
  .flatMap(sentence => sentence.split(" "))

let i = 0

let id = setInterval(() => {
  readline.clearLine(stdout, 0)
  readline.cursorTo(stdout, 0)
  stdout.write(text[i++])
  if (i >= text.length) clearInterval(id)
}, wpm)
