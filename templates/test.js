let { default: kill } = await need("tree-kill")

let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working!")

if (response.data.name != "simplescripts") {
  exit()
}

let testFile = "test.txt"
await writeFile(testFile, "testing")
let child = spawn(`share-file`, [testFile, "--trust"], {
  stdio: "inherit",
})

await new Promise((res, rej) => {
  setTimeout(res, 3000)
})
console.log("after timeout")
rm(testFile)
kill(child.pid)
