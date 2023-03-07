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

ava.serial(`Get metadata from a string`, t => {
  let name = `Eat a Taco`
  let description = `Orders a taco`
  let file = `
// Name: ${name}
// Description: ${description}

console.log("taco")
  `

  let metadata = getMetadata(file)

  t.deepEqual(metadata, { name, description })
})

ava.serial(`No metadata`, t => {
  let file = ``

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt,
  })
})

ava.serial(`Empty metadata`, t => {
  let file = `
// Name:
// Description:      
  `

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt,
  })
})

ava.serial(`Strip metadata`, t => {
  let code = `console.log("hello")`
  let file = `
// Name: This is a Menu
// Shortcode: a,b,c
// Alias: al
// Other: hi

${code}
`
  let strippedFile = stripMetadata(file)

  t.is(
    strippedFile,
    `
// Name:
// Shortcode:
// Alias:
// Other:

${code}
`
  )
})

ava.serial(`Strip metadata variations`, t => {
  let code = `console.log("hello")`
  let file = `
//Menu: This is a Menu
//  Shortcode:a,b,c
// Alias: al
//   Other:  hi

${code}
`
  let strippedFile = stripMetadata(file)

  t.is(
    strippedFile,
    `
//Menu:
//  Shortcode:
// Alias:
//   Other:

${code}
`
  )
})

ava.serial(`Strip metadata exclude`, t => {
  let code = `console.log("hello")`
  let file = `
// Name: This is a Menu
// Shortcode: a,b,c
// Alias: al
// Other: hi

${code}
`
  let strippedFile = stripMetadata(file, ["Name", "Alias"])

  t.is(
    strippedFile,
    `
// Name: This is a Menu
// Shortcode:
// Alias: al
// Other:

${code}
`
  )
})

ava.serial(`Don't strip after comments`, t => {
  let file = `
// How many entries should the chart show
const child = exec(command, { async: true });  
  `

  let strippedFile = stripMetadata(file, ["Menu", "Alias"])

  t.is(strippedFile, file)
})
