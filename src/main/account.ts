// Name: Login to GitHub
// Description: Authenticate to Enable Features
import { authenticate } from "../api/kit.js"
import { getUserDb } from "../core/db.js"
import { userDbPath } from "../core/utils.js"
let userDb = await getUserDb()
if (userDb.login) {
  await arg("Account", ["Sign Out"])
  await rm(userDbPath)
  await mainScript()
} else {
  await arg(
    {
      placeholder: "Sign In",
      enter: "Sign In",
      shortcuts: [],
    },
    md(`
# Press Enter to Sign in to GitHub

## Sign in to Enable Features

### Standard Features

- Create Gists

### Pro Features

Unlock a Pro Account: [https://github.com/sponsors/johnlindquist](https://github.com/sponsors/johnlindquist) to unlock these features:

> ⭐️ Make sure to select a "Script Kit Pro" sponsorship tier.

- Debugger
- Log Window

#### Coming Soon
- Sync Scripts to GitHub Repo
- Run Script Remotely as GitHub Actions
- Advanced Widgets
- await screenshot()
- await selfie()
- await audio()
        `)
  )

  await authenticate()

  await mainScript()
}
