let sponsorsDir = kenvPath("kenvs", "sponsors")
$.verbose = false
if (await isDir(sponsorsDir)) {
  cd(sponsorsDir)
  await exec(`git pull --rebase --autostash --stat`)
} else {
  cd(kenvPath("kenvs"))
  await exec(
    `git clone https://github.com/johnlindquist/kit-sponsors sponsors`
  )
}

export {}
