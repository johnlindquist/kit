let command = "npm ci"
if (isWin) {
	// For Windows (both CMD and PowerShell)
	command = `$env:PATH="${knodePath("bin")};$env:PATH" && ${command}`
} else {
	command = `export PATH=${knodePath("bin")}:$PATH && ${command}`
}

await term({
	command,
	cwd: kenvPath()
})

export {}
