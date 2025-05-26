import ava from 'ava'
import '../../test-sdk/config.js'
import { pathToFileURL } from 'node:url'

let importKit = async (...parts) => {
  let partsPath = path.resolve(process.env.KIT, ...parts)
  let importPath = pathToFileURL(partsPath).href
  console.log({ importPath })
  return await import(importPath)
}

/** @type {import("./utils")} */
let { getMetadata, parseMetadata, postprocessMetadata, stripMetadata } = await importKit('core', 'utils.js')

/** @type {import("./enum.js")} */
let { ProcessType, UI } = await importKit('core', 'enum.js')

ava.serial(`Get metadata from a string`, (t) => {
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

ava.serial(`Get boolean metadata from a string`, (t) => {
  let name = `Eat a Taco`
  let background = 'true'
  let file = `
// Name: ${name}
// Background: ${background}

console.log("taco")
  `

  let metadata = getMetadata(file)

  t.deepEqual(metadata, { name, background: true })
})

ava.serial(`No metadata`, (t) => {
  let file = ``

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt
  })
})

ava.serial(`Empty metadata`, (t) => {
  let file = `
// Name:
// Description:      
  `

  let metadata = parseMetadata(file)

  t.deepEqual(metadata, {
    type: ProcessType.Prompt
  })
})

ava.serial(`Strip metadata`, (t) => {
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

${code}
`
  )
})

ava.serial(`Strip metadata variations`, (t) => {
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
//  Shortcode:a,b,c
// Alias: al
//   Other:  hi

${code}
`
  )
})

ava.serial(`Strip metadata exclude`, (t) => {
  let code = `console.log("hello")`
  let file = `
// Name: This is a Menu
// Shortcode: a,b,c
// Alias: al
// Other: hi

${code}
`
  let strippedFile = stripMetadata(file, ['Name', 'Alias'])

  t.is(
    strippedFile,
    `
// Name: This is a Menu
// Alias: al

${code}
`
  )
})

ava.serial(`Don't strip after comments`, (t) => {
  let file = `
// How many entries should the chart show
const child = exec(command, { async: true });  
  `

  let strippedFile = stripMetadata(file, ['Menu', 'Alias'])

  t.is(strippedFile, file)
})

ava.serial(`postprocessMetadata only adds type 'Prompt'`, (t) => {
  let name = `Eat a Taco`
  let description = `Orders a taco`
  let file = `
// Name: ${name}
// Description: ${description}

console.log("taco")
  `

  let metadata = getMetadata(file)
  let processedMetadata = postprocessMetadata(metadata, file)

  t.deepEqual(processedMetadata, {
    name,
    description,
    type: ProcessType.Prompt
  })
})

ava.serial(`postprocessMetadata finds 'hasPreview' and 'hasFlags'`, (t) => {
  let name = `Eat a Taco`
  let description = `Orders a taco`
  let file = `
// Name: ${name}
// Description: ${description}

await arg({
  onInit: ()=> {
    setFlags({})
  },
  preview: ()=> {}
})
  `

  let metadata = getMetadata(file)
  let processedMetadata = postprocessMetadata(metadata, file)

  t.deepEqual(processedMetadata, {
    name,
    description,
    hasPreview: true,
    type: ProcessType.Prompt
  })
})

ava.serial(`getMetadata supports convention-based metadata export`, async (t) => {
  global.log = t.log

  // Seems only necessary when creating a new file
  // await $`kit set-env-var KIT_METADATA_MODE convention`

  let name = `Testing convention metadata`
  let description = `Convention metadata description`
  let schedule = `* * * * * *`
  let file = `
import "@johnlindquist/kit"

export const metadata: Metadata = {
  name: "${name}",
  description: "${description}",
  schedule: "${schedule}",
}
  `

  let metadata = getMetadata(file)
  let processedMetadata = postprocessMetadata(metadata, file)

  t.deepEqual(processedMetadata, {
    name,
    description,
    schedule,
    type: ProcessType.Schedule
  })
})

ava.serial(`new script supports KIT_METADATA_MODE`, async (t) => {
  global.log = t.log
  let name = `testing-convention-metadata`
  let scriptPath = kenvPath('scripts', `${name}.ts`)

  if (await pathExists(scriptPath)) {
    await unlink(scriptPath)
  }

  await exec(`kit new ${name} main --no-edit`, {
    env: {
      ...process.env,
      KIT_NODE_PATH: process.execPath,
      KIT_MODE: 'ts',
      KIT_METADATA_MODE: 'convention'
    }
  })

  t.log(`Getting script path and testing`)

  t.true(await pathExists(scriptPath), `Should create ${scriptPath}`)

  let file = await readFile(scriptPath, 'utf-8')
  t.log({ file })

  let metadata = getMetadata(file)
  t.log({ metadata })
  let processedMetadata = postprocessMetadata(metadata, file)

  t.deepEqual(processedMetadata, {
    name,
    type: ProcessType.Prompt
  })
})
