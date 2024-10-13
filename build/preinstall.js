import path from 'node:path';
import { rimraf } from 'rimraf';
import { platform } from 'node:os';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

let isCI = process.env.CI === 'true';
if (isCI) {
  console.log('Running in CI, skipping preinstall');
} else {
  let kitPath = (...pathParts) => path.resolve(process.cwd(), ...pathParts);

  if (platform() === 'win32') {
    let binFileToRemove = 'kit';
    let binFilePathToRemove = kitPath('bin', binFileToRemove);
    console.log(`Checking if ${binFilePathToRemove} exists...`);

    if (existsSync(binFilePathToRemove)) {
      console.log(`Removing ${kitPath('bin', binFileToRemove)} so it doesn't interfere with kit.bat`);
      await rimraf(kitPath('bin', binFileToRemove));
    } else {
      console.log(`${binFilePathToRemove} does not exist. Skipping...`);
    }

    let kitBat = 'bin/kit.bat';
    let batFilePath = kitPath(kitBat.split('/'));
    let packageJsonPath = kitPath('package.json');
    if (existsSync(batFilePath)) {
      // Update the package.json to use the new bin file name
      let packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      packageJson.bin.kit = 'bin/kit.bat';
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } else {
      console.log(`${batFilePath} does not exist. Skipping...`);
    }
  }
}
