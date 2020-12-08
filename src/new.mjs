#!/usr/bin/env js
/**
 * Creates a new script with symlinks and permissions then opens it in VS Code
 *
 * Usage:
 * new my-first-script
 */
let name = await arg(0, "Name your script:")

createScript(name)
