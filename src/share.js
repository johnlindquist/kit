//Description: Share a script with a friend!

const name = await arg("Select a script to share:", {
  type: "search-list",
  choices: await getScriptsInfo(),
})

const scriptName = name + ".js"

const content = await readFile(
  path.join(process.env.SIMPLE_SRC_PATH, scriptName),
  "utf8"
)

const body = {
  files: {
    [scriptName]: {
      content,
    },
  },
  public: true,
}

const response = await post(
  `https://simplescripts.dev/api/share`,
  body
)

const gist = response.data.files[scriptName]
const url = gist.raw_url

const newCommand = `new ${name} --url ${url}`
echo(
  chalk.yellow(
    `
Copied the command below to clipboard 📋.
Paste it to a friend and they'll have your script. 😎
`
  )
)
echo(`${newCommand}
`)
copy(newCommand)
