/**
 * Description: Creates a new empty script you can invoke from the terminal
 */

let name = await arg("Enter a name for your script:")

let { createScript } = await import(
  "./simple/createScript.js"
)
await createScript(name, {
  contents: arg?.url
    ? (await get(arg?.url)).data
    : undefined,
  need: arg?.need,
  simplify: arg?.simplify,
  template: arg?.template,
})
