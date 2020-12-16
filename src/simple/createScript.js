let { createSourceFilePath, createBinFile } = await import(
  "./utils.js"
)

export let createScript = async (
  name,
  { contents, need = [], simplify = [] } = {}
) => {
  let template = await env("SIMPLE_TEMPLATE")
  let result = exec(`command -v ${name}`, { silent: true })
  if (result.stdout) {
    console.log(`${name} already exists. 
${result.stdout.trim()}
Please pick a different name:`)
    spawn("new", [], { stdio: "inherit" })
    return
  }

  let simpleTemplatePath = path.join(
    env.SIMPLE_PATH,
    "templates",
    template + ".js"
  )

  if (typeof contents == "undefined") {
    let simpleTemplate = await readFile(
      simpleTemplatePath,
      "utf8"
    )
    simpleTemplate = Handlebars.compile(simpleTemplate)
    simpleTemplate = simpleTemplate({
      ...env,
      name,
    })
    contents = simpleTemplate
  }
  let simpleFilePath = createSourceFilePath(name)

  if (typeof need == "string") {
    contents = `let {} = await need("${need}")\n` + contents
  } else {
    contents =
      need
        .map(pkg => `let {} = await need("${pkg}")`)
        .join("\n") + contents
  }

  if (typeof simplify == "string") {
    contents =
      `let {} = await simplify("${simplify}")\n` + contents
  } else {
    contents =
      simplify
        .map(pkg => `let {} = await simplify("${pkg}")`)
        .join("\n") + contents
  }

  await writeFile(simpleFilePath, contents)
  await createBinFile(name)

  let greenName = chalk.green.bold(name)
  let yellowTemplate = chalk.yellow(template)

  echo(
    `\n> Created a ${greenName} script using the ${yellowTemplate} template.`
  )

  let line = 1
  let col = 1

  if (need.length || simplify.length) col = 6

  edit(simpleFilePath, "", line, col)
}
