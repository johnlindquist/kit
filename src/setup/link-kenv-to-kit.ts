import { pathToFileURL } from "url"

// Installing ~/.kit to ~/.kenv _copies_ the files to ~/.kenv/node_modules/@johnlindquist/kit
// But we need to use a symlink to make sure we're always using the latest version of @johnlindquist/kit
// And to make sure it's loading the same files or they might be loaded twice
// (once from the ~/.kit and one from the ~/.kenv/node_modules/@johnlindquist/kit)
// The app will attempt to keep the symlink in place
await cli(
  "install",
  pathToFileURL(process.env.KIT || home(".kit")).toString()
)

export {}
