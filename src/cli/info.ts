let name = await arg()
let description = await arg()

let html = md(await arg())

await div({
  name,
  description,
  html,
})

export {}
