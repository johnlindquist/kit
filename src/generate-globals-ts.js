//Description: WIP - Attempting to generate a typedef file to capture simple's global api
let template = Object.keys(globalApi).reduce(
  (acc, curr) =>
    `${acc}
declare function ${curr}():any;`.trim(),
  ""
)

writeFile(
  path.join(env.SIMPLE_PATH, "global.d.ts"),
  template
)
