let { default: readline } = await import("readline")
let { default: stripAnsi } = await import("strip-ansi")

let child = spawn("simple")

const rl = readline.createInterface({
  input: child.stdout,
  output: child.stdout,
})

let lines = []
rl.on("line", line => {
  console.log(line)
  lines.push(stripAnsi(line).trim())
})

let runTest = data => {
  child.stdin.end()
}

child.stdout.on("data", runTest)
child.stdout.on("end", () => {
  console.log(lines)
})

// let enterName = () => lines[0].includes("Enter your name")
// let help = () => lines[1].includes("hello-world John")
// let result = () => lines[2].includes("Hello, Joe!")
// child.stdout.on("end", end => {
//     console.log()
//   let tests = [enterName, help, result]

//   console.log(
//     chalk`{yellow Running ${env.SIMPLE_SCRIPT_NAME} tests}`
//   )
//   tests.forEach(fn => {
//     if (fn()) {
//       console.log(chalk`{green ${fn.name}} passed`)
//     } else {
//       console.log(chalk`{red ${fn.name}} failed`)
//       exit()
//     }
//   })
// })
