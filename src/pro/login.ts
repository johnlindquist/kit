//Menu: Login to GitHub
//Description: Authenticate to enable GitHub features

import { getUserDb } from "../core/db.js"
import { Octokit } from "../share/auth-scriptkit.js"
await beep()
let octokit = new Octokit({
  auth: {
    scopes: ["gist"],
    env: "GITHUB_SCRIPTKIT_TOKEN",
  },
})

// get authenticated user
let user = await octokit.rest.users.getAuthenticated()

let userDb = await getUserDb()
_.assign(userDb, user.data)
await userDb.write()

export {}
