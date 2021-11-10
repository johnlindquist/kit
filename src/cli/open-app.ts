await wait(5000)

let { stdout } = await $`ps aux | [K]it.app`
if (stdout.trim() === "") {
  await $`open /Applications/Kit.app`
}

export {}
