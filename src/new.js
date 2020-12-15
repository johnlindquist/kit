/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let name = await arg("Enter a name for your script:")
let contents
if (arg["url"]) {
  contents = (await get(arg["url"])).data
}

let { createScript } = await import(
  "./simple/createScript.js"
)
await createScript(name, contents, arg["need"])
