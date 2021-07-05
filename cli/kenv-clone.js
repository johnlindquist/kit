import { getLastSlashSeparated } from "kit-bridge/esm/util";
let kenvsDir = kenvPath("kenvs");
if (!(await isDir(kenvsDir))) {
    mkdir("-p", kenvsDir);
}
let repo = await arg({
    placeholder: `Enter url to kenv repo`,
    ignoreBlur: true,
});
let kenvName = await arg({
    placeholder: `Enter a kenv name`,
    input: getLastSlashSeparated(repo, 1),
    hint: `Name kenv dir`,
});
let kenvDir = kenvPath("kenvs", kenvName);
let simpleGit = await npm("simple-git");
let git = simpleGit();
await git.clone(repo, kenvDir);
