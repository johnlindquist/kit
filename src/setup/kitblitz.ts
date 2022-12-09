;(async function () {
  await import("../api/global.js")
  let $PROJECT = path.resolve(process.cwd())
  let contents = {
    installDependencies: true,
    startCommand:
      "kitbnode ./node_modules/@johnlindquist/kit/setup/kitblitz.js",
    env: {
      PATH: `${$PROJECT}/bin:${$PROJECT}/node_modules/@johnlindquist/kit/override/stackblitz/bin:/bin:/usr/bin:/usr/local/bin`,
    },
  }
  let sbrcPath = path.resolve($PROJECT, ".stackblitzrc")
  await outputJson(sbrcPath, contents, { spaces: "\t" })
})()
