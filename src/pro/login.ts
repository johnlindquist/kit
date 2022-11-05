// Name: Login to GitHub
// Description: Authenticate to Enable Features

import { authenticate } from "../api/kit.js"

await div(
  md(`
# Sign in to GitHub

## Sign in to Enable Features

### Standard Features

- Create Gists

### Pro Features

- Debugger
- Sync Scripts to GitHub Repo
- Run Scripts as GitHub Actions
- 
`)
)

await authenticate()

await mainScript()

export {}
