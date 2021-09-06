"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let envTemplate = await readFile(kitPath("templates", "env", "template.env"), "utf8");
let envTemplateCompiler = compile(envTemplate);
let compiledEnvTemplate = envTemplateCompiler({ ...env });
await writeFile(kenvPath(".env"), compiledEnvTemplate);
