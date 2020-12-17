let response = await get(
  `https://api.github.com/repos/johnlindquist/simplescripts`
)
echo(response.data.name + " is working! LIES!!!")

spawn(`exit`, ["1"], { stdio: "inherit" })

echo("HOW IS THIS NOT EXITING!!!!!")
