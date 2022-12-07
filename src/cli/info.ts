let name = await arg()
let description = await arg()

setName(name)
setDescription(description)

let html = md(await arg())

await div({
  name,
  description,
  html,
})

export {}
