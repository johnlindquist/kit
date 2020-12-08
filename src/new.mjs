#!js
/**
 * Creates a new script with symlinks and permissions then opens it in VS Code
 *
 * Usage:
 * new my-first-script
 */
let name = args[0]

if (!name) {
  ;({ name } = await prompt({ name: "name" }))

  nextTime("new " + name)
}

createScript(name)
