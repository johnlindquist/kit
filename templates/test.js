let { default: kill } = await need("tree-kill")

let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working!")

if (response.data.name != "simplescripts") {
  exit()
}
echo(`successfully create a new script`)

let testFile = "test.txt"
await writeFile(testFile, "testing")
let child = spawn(`share-file`, [testFile, "--trust"])

await new Promise((res, rej) => {
  setTimeout(res, 3000)
})
rm(testFile)
kill(child.pid)
echo(`share-file ran successfully`)
