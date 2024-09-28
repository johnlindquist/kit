let sponsorsDir = kenvPath("kenvs", "sponsors")

if (await isDir(sponsorsDir)) {
	await exec("git pull --rebase --autostash --stat", {
		cwd: sponsorsDir
	})
} else {
	await exec(
		"git clone https://github.com/johnlindquist/kit-sponsors sponsors",
		{
			cwd: kenvPath("kenvs")
		}
	)
}

export type {}
