import ava from "ava"
import "../../test/config.js"

/** @type {import("./utils")} */
let {
  resolveToScriptPath,
  getMetadata,
  parseMetadata,
  stripMetadata,
} = await import(kitPath("core", "utils.js"))

/** @type {import("./utils")} */
let { ProcessType, UI } = await import(
  kitPath("core", "enum.js")
)

ava(`Get metadata from a string`, t => {
  let menu = `Eat a Taco`
  let description = `Orders a taco`
  let file = `
// Menu: ${menu}
// Description: ${description}

console.log("taco")
  `

  let metadata = getMetadata(file)

  t.deepEqual(metadata, { menu, description })
})

ava(`No metadata`, t => {
  let file = ``

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt,
  })
})

ava(`Empty metadata`, t => {
  let file = `
// Menu:
// Description:      
  `

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt,
  })
})

ava(`Strip metadata`, t => {
  let code = `console.log("hello")`
  let file = `
// Menu: This is a Menu
// Shortcode: a,b,c
// Alias: al
// Other: hi

${code}
`
  let strippedFile = stripMetadata(file)

  t.is(
    strippedFile,
    `
// Menu:
// Shortcode:
// Alias:
// Other:

${code}
`
  )
})

ava(`Strip metadata exclude`, t => {
  let code = `console.log("hello")`
  let file = `
// Menu: This is a Menu
// Shortcode: a,b,c
// Alias: al
// Other: hi

${code}
`
  let strippedFile = stripMetadata(file, ["Menu", "Alias"])

  t.is(
    strippedFile,
    `
// Menu: This is a Menu
// Shortcode:
// Alias: al
// Other:

${code}
`
  )
})
