import fs from 'node:fs/promises'
import { KIT_FIRST_PATH } from '../core/utils.js'

async function downloadAndSetupExamples() {
  let destination = kenvPath('tmp')
  await download('https://github.com/johnlindquist/kit-examples-ts/archive/main.zip', destination, {
    extract: true,
    rejectUnauthorized: false
  })

  let source = path.join(destination, 'kit-examples-main')
  let newDestination = kenvPath('kenvs', 'examples')
  await fs.rename(source, newDestination)

  let files = await fs.readdir(path.join(newDestination, 'scripts'))
  let firstFile = path.join(newDestination, 'scripts', files[0])
  if (await fs.stat(firstFile)) {
    await wait(1000)
    await fs.utimes(firstFile, new Date(), new Date())
  }
}

let examplesDir = kenvPath('kenvs', 'examples')
if (await isDir(examplesDir)) {
  cd(examplesDir)

  if (isDir(kenvPath('kenvs', 'examples', '.git'))) {
    await exec('git stash', {
      cwd: examplesDir
    })
    await exec('git pull', {
      cwd: examplesDir
    })
  }
} else if (await isBin('git')) {
  try {
    await exec(
      'git clone --depth 1 --verbose --progress https://github.com/johnlindquist/kit-examples-ts.git examples',
      {
        cwd: kenvPath('kenvs')
      }
    )
  } catch (error) {
    await downloadAndSetupExamples()
  }
} else {
  await downloadAndSetupExamples()
}

try {
  await exec('npm i', {
    cwd: kenvPath('kenvs', 'examples'),
    env: {
      ...global.env,
      PATH: KIT_FIRST_PATH
    }
  })
} catch (error) {}

export {}
