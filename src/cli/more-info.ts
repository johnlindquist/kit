let file = JSON.parse(
  await readFile(kenvPath("package.json"), {
    encoding: "utf8",
  })
)

let site = await arg(
  chalk`Which package site do you want to visit?`,
  [
    ...Object.keys(file?.dependencies || []),
    ...Object.keys(file?.devDependencies || []),
  ].map(name => ({
    name,
    value: `https://npmjs.com/package/${name}`,
    description: `https://npmjs.com/package/${name}`,
  }))
)

// console.log(`Opening ${site}`)

await browse(site)

exit()

export {}
