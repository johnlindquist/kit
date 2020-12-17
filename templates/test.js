let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working!")

spawn(`exit`, ["1"], { stdio: "inherit" })
