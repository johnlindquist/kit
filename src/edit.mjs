

/**
 * Description: Opens the selected script in your editor
 */

let child = spawn("js", ["edit", arg[0]].filter(Boolean), {
  stdio: "inherit",
})
