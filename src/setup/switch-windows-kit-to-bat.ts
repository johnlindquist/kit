// If windows, switch the package.json bin/kit to bin/kit.bat

if (process.platform === "win32") {
  const packageJsonPath = kitPath("package.json")
  const packageJson = await readJson(packageJsonPath)

  packageJson.bin.kit = "bin/kit.bat"

  await writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2)
  )
}

export {}
