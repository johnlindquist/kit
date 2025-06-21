import { KIT_FIRST_PATH } from '../core/utils.js'

async function downloadAndSetupExamples() {
  let destination = kenvPath('tmp')
  await download('https://github.com/johnlindquist/kit-examples-ts/archive/main.zip', destination, {
    extract: true
    // rejectUnauthorized: false - removed for security reasons
  })

  let source = path.join(destination, 'kit-examples-main')
  let newDestination = kenvPath('kenvs', 'examples')
  await rename(source, newDestination)
}

async function pnpmInstallExamples() {
  await exec('pnpm i', {
    cwd: kenvPath('kenvs', 'examples'),
    env: {
      ...global.env,
      PATH: KIT_FIRST_PATH
    }
  }).catch((error) => {
    console.error(error)
  })
}

let examplesDir = kenvPath('kenvs', 'examples')

if (await isDir(examplesDir)) {
  await exec('git pull --rebase --autostash --stat', {
    cwd: examplesDir
  })
} else {
  try {
    await exec('git clone --depth 1 https://github.com/johnlindquist/kit-examples-ts examples', {
      cwd: kenvPath('kenvs')
    })
  } catch (error) {
    await downloadAndSetupExamples()
  }
}

await pnpmInstallExamples()
