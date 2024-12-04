import _chalk from "chalk"
import _chalkTemplate from "chalk-template"
// TODO: Upgrade to Chalk v5 once the templates are supported
export let chalk = ((global as any).chalk = _chalkTemplate)
