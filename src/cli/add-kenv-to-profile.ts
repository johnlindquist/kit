import { existsSync } from "fs"

//Description: Adds the .kenv bin dir to your $PATH
export {}

let kenv = await selectKenv()

if (process.platform === "win32") {
  await div(`## To add .kenv/bin to your path on Windows
  
1. Open the Start Search, type in "env", and choose "Edit the system environment variables"
2. Click the "Environment Variables..." button.
3. Under the "System Variables" section, scroll down and highlight the "Path" variable, then click the "Edit..." button.  
4. In the next screen, click "New" and then "Browse" to find the ${kenvPath(
    "bint"
  )} directory.
5. Click "OK" to close the dialogs.
6. Close the terminal and open it again.
  `)

  exit()
}

let exportKenvPath = `export PATH="$PATH:${path.resolve(
  kenv.dirPath,
  "bin"
)}"`

let choices = [
  `.zshrc`,
  `.bashrc`,
  `.bash_profile`,
  `.config/fish/config.fish`,
  `.profile`,
]

let profiles = choices
  .map(profile => `${env.HOME}/${profile}`)
  .filter(profile => existsSync(profile))

let selectedProfile = await arg(
  "Select your profile:",
  profiles
)

await appendFile(selectedProfile, `\n${exportKenvPath}`)
let { stdout } = execaCommandSync(`wc ${selectedProfile}`)
let lineCount = stdout.trim().split(" ").shift()

await edit(selectedProfile, kenvPath(), lineCount)
