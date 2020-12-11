/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let name = await arg("Enter a name for your script:")
let template = await env("SIMPLE_TEMPLATE")
await createScript(name, template)
