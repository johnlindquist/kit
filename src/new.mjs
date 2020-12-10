#!/usr/bin/env js
/**
 * Description: Creates a new empty script you can invoke from the terminal
 *
 * Usage:
 * new my-first-script
 */

let name

if ((await env["TEMPLATE"]) == "tutorial") {
  name = await arg("Enter a name for your script:", {
    type: "suggest",
    name: "name",
    suggestions: [
      "hello-world",
      "my-first-script",
      "party-time",
      "demo-time",
      "woo-hoo",
    ],
  })
} else {
  name = await arg()
}

createScript(name)
