// Template: true

import "@johnlindquist/kit"

let name = await arg("Enter name")

let template = `
Hello, ${name}!
`.trim()

setSelectedText(template)
