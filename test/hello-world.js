let { default: readline } = await import("readline")
let { default: stripAnsi } = await import("strip-ansi")

let child = spawn("hello-world")

const rl = readline.createInterface({
  input: child.stdout,
  output: child.stdout,
})

let lines = []
rl.on("line", line => {
  lines.push(stripAnsi(line).trim())
})

let runTest = data => {
  child.stdin.write(Buffer.from("John\n"))
  child.stdin.end()
}

child.stdout.on("data", runTest)

let enterName = () => lines[0].includes("Enter your name")
let help = () => lines[1].includes("hello-world John")
let result = () => lines[2].includes("Hello, Joe!")
child.stdout.on("end", end => {
  let tests = [enterName, help, result]

  console.log(
    chalk`{yellow Running ${env.KIT_SCRIPT_NAME} tests}`
  )
  tests.forEach(fn => {
    if (fn()) {
      console.log(chalk`{green ${fn.name}} passed`)
    } else {
      console.log(chalk`{red ${fn.name}} failed`)
      exit()
    }
  })
})
