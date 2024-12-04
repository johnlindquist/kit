import { replaceInFile } from "replace-in-file"

export let replace = (global.replace = replaceInFile)
