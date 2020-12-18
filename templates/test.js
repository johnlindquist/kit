let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working!")

if (response.data.name != "simplescripts") {
  exit()
}

//testing share-file
let testFile = "test.txt"
await writeFile(testFile, "testing")
let child = spawn(`share-file`, [testFile], {
  stdio: "inherit",
})

await new Promise((res, rej) => {
  setTimeout(res, 3000)
})
console.log("after timeout")
rm(testFile)
child.kill()
