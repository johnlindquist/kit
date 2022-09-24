import { pathToFileURL } from "url"

await cli(
  "install",
  pathToFileURL(process.env.KIT || home(".kit")).toString()
)

export {}
