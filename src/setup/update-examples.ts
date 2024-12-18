import { KIT_FIRST_PATH } from '../core/utils.js'

let examplesDir = kenvPath('kenvs', 'examples')
if (await isDir(examplesDir)) {
  await exec(`git stash`, {
    cwd: examplesDir
  })
  let { stdout } = await exec(`git pull`, {
    cwd: examplesDir
  })

  if (!stdout.includes('Already up to date.')) {
    try {
      await exec(`pnpm i`, {
        cwd: kenvPath('kenvs', 'examples'),
        env: {
          ...global.env,
          PATH: KIT_FIRST_PATH
        }
      })
    } catch (error) {}
  }
}

export {}
