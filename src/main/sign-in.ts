// Name: Sign In to GitHub
// Description: Authenticate with GitHub to Enable Features
// Enter: View Account
// PreviewPath: $KIT/SIGN_IN.md

import { authenticate } from "../api/kit.js"

hide()

await authenticate()

await mainScript()
