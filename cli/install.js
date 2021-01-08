let packageNames = await arg(
  "Which npm package/s would you like to install?"
)

let installNames = [...packageNames.split(" "), ...args]

spawn(env.SIMPLE_NPM, ["install", ...installNames], {
  stdio: "inherit",
})
