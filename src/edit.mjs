/**
 * Description: Opens the selected script in your editor
 */

let child = spawn(
  "simple",
  ["edit", arg[0]].filter(Boolean),
  {
    stdio: "inherit",
  }
)
