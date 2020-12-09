#!/usr/bin/env js

import { format } from "date-fns"

const date = format(new Date(), "yyyy-MM-dd-hh-mm-ss")
const fileName = date + ".md"

const template = `
Your pasted contents are here:
${paste()}
`.trim()

await writeFile(fileName, template)
editor(fileName)
