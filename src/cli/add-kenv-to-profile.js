"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
let exportKenvPath = `export PATH="$PATH:${kenvPath("bin")}"`;
let choices = [
    `.zshrc`,
    `.bashrc`,
    `.bash_profile`,
    `.config/fish/config.fish`,
    `.profile`,
];
let profiles = choices
    .map(profile => `${env.HOME}/${profile}`)
    .filter(profile => (0, fs_1.existsSync)(profile));
let selectedProfile = await arg("Select your profile:", profiles);
await appendFile(selectedProfile, `\n${exportKenvPath}`);
let { stdout } = exec(`wc ${selectedProfile}`, {
    silent: true,
});
let lineCount = stdout.trim().split(" ").shift();
edit(selectedProfile, kenvPath(), lineCount);
