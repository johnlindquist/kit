/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let { name, tutorial } = await import("./tutorial/check.js")
name ??= await arg("Enter a name for your script:")
if (tutorial)
  await import("./tutorial/text.js?name=" + name)

await createScript(name)
